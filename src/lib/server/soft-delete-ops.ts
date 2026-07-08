/**
 * Transactional soft-delete execution (the write side of the soft-delete system).
 *
 * `src/lib/server/soft-delete.ts` holds the pure scoping rules + the read
 * extension that hides trashed rows. This module performs the actual delete:
 * it stamps `deletedAt`/`deletedBy` on a record and, in the SAME transaction,
 * cascades that stamp to exactly the child rows today's `ON DELETE CASCADE`
 * would remove — so every financial roll-up stays identical to a hard delete
 * while the data survives for the Recycle Bin.
 *
 * It is kept separate from soft-delete.ts on purpose: this file imports the
 * Prisma client (`@/lib/db`), whereas soft-delete.ts must not (db.ts imports the
 * extension from it, so importing the client back would be circular).
 */
import { prisma } from "@/lib/db";
import {
  cascadeChildrenFor,
  isSoftDeletableModel,
  type CascadeChildModel,
} from "@/lib/server/soft-delete";

/** Prisma delegate (camelCase) for each soft-deletable model (PascalCase). */
const DELEGATE_BY_MODEL: Readonly<Record<string, string>> = {
  Patient: "patient",
  Procedure: "procedure",
  TreatmentRecord: "treatmentRecord",
  Payment: "payment",
  PatientFile: "patientFile",
  Doctor: "doctor",
  TreatmentDoctor: "treatmentDoctor",
  DoctorPayout: "doctorPayout",
  ClinicExpense: "clinicExpense",
};

/** Inverse map for recursing into a cascade child's own children. */
const MODEL_BY_DELEGATE: Readonly<Record<CascadeChildModel, string>> = {
  treatmentRecord: "TreatmentRecord",
  payment: "Payment",
  treatmentDoctor: "TreatmentDoctor",
  doctorPayout: "DoctorPayout",
};

type IdRow = { id: string };

/**
 * Minimal structural view of the Prisma delegate methods this module uses. The
 * interactive-transaction client indexes its delegates by dynamic string, which
 * Prisma's generated types can't express, so the tx is cast to this shape once.
 */
type DelegateOps = {
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<IdRow>;
  updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  findMany(args: { where: Record<string, unknown>; select: { id: true } }): Promise<IdRow[]>;
};
type DelegateMap = Record<string, DelegateOps>;

/**
 * Recursively stamp `deletedAt` on the cascade children of `parentModel` whose
 * FK points at `parentIds`. Only currently-live children are touched
 * (`deletedAt: null`), so a child already trashed on its own (e.g. a split
 * removed with its doctor) keeps its original timestamp and is NOT re-linked to
 * this parent's deletion.
 */
async function cascadeSoftDelete(
  tx: DelegateMap,
  parentModel: string,
  parentIds: string[],
  deletedBy: string | null,
  deletedAt: Date,
): Promise<void> {
  if (parentIds.length === 0) return;
  for (const child of cascadeChildrenFor(parentModel)) {
    const delegate = tx[child.model];
    const live = await delegate.findMany({
      where: { [child.fk]: { in: parentIds }, deletedAt: null },
      select: { id: true },
    });
    if (live.length === 0) continue;
    const ids = live.map((r) => r.id);
    await delegate.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { deletedAt, deletedBy } });
    await cascadeSoftDelete(tx, MODEL_BY_DELEGATE[child.model], ids, deletedBy, deletedAt);
  }
}

/**
 * Soft-delete one record and its cascade children inside a caller-provided
 * transaction. Use this when the route needs additional writes in the same
 * transaction; otherwise call {@link softDeleteEntity}.
 *
 * The parent uses `update` (not `updateMany`) so a missing id throws exactly as
 * the old `delete()` did. Children share the parent's single `deletedAt`, which
 * a later restore matches to re-link precisely this delete's rows.
 */
export async function softDeleteInTransaction(
  tx: unknown,
  model: string,
  id: string,
  deletedBy: string | null,
  deletedAt: Date,
): Promise<void> {
  if (!isSoftDeletableModel(model)) {
    throw new Error(`softDelete: model "${model}" is not soft-deletable`);
  }
  const map = tx as DelegateMap;
  await map[DELEGATE_BY_MODEL[model]].update({ where: { id }, data: { deletedAt, deletedBy } });
  await cascadeSoftDelete(map, model, [id], deletedBy, deletedAt);
}

/**
 * Soft-delete one record (+ cascade) in its own transaction. Convenience wrapper
 * around {@link softDeleteInTransaction} for the common single-record case.
 */
export async function softDeleteEntity(
  model: string,
  id: string,
  deletedBy: string | null,
  deletedAt: Date = new Date(),
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await softDeleteInTransaction(tx, model, id, deletedBy, deletedAt);
  });
}
