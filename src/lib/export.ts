import type { DeliveryItem } from "../types";

async function loadXLSX() {
  const XLSX = await import("xlsx");
  return XLSX;
}

/**
 * Export delivery items to Excel with proper filename.
 * xlsx is loaded dynamically to avoid bloating the initial bundle.
 */
export async function exportDeliveryNote(
  items: DeliveryItem[],
  customerName: string,
  deliveryNumber: string,
) {
  const XLSX = await loadXLSX();

  const rows = items.map((it) => ({
    "序号": it.seq,
    "订单号": it.order_number || "",
    "料号": it.material_code || "",
    "品名": it.product_name,
    "数量": it.quantity,
    "单价": Number(it.unit_price),
    "金额": Number(it.amount),
    "备注": it.notes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 20 },
    { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 20 },
  ];

  const total = items.reduce((s, it) => s + Number(it.amount), 0);
  XLSX.utils.sheet_add_aoa(ws, [["", "", "", "合计", "", "", total, ""]], { origin: -1 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "送货单");
  XLSX.writeFile(wb, `${customerName}_${deliveryNumber}.xlsx`);
}

/**
 * Export billing statement to Excel.
 */
export async function exportBilling(
  rows: (DeliveryItem & { delivery_number: string; delivery_date: string })[],
  customerName: string,
  yearMonth: string,
) {
  const XLSX = await loadXLSX();

  const data = rows.map((r) => ({
    "送货单号": r.delivery_number,
    "送货日期": r.delivery_date,
    "序号": r.seq,
    "订单号": r.order_number || "",
    "料号": r.material_code || "",
    "品名": r.product_name,
    "数量": r.quantity,
    "单价": Number(r.unit_price),
    "金额": Number(r.amount),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 14 }, { wch: 12 }, { wch: 6 }, { wch: 14 },
    { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
  ];

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "", "", "", "合计", total]], { origin: -1 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "对账单");
  XLSX.writeFile(wb, `${customerName}_${yearMonth}.xlsx`);
}
