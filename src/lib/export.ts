import type { DeliveryItem } from "../types";

async function loadXLSX() {
  const XLSX = await import("xlsx");
  return XLSX;
}

interface NoteMeta {
  companyName: string;
  companyEn: string;
  customerName: string;
  customerAddress: string;
  deliveryNumber: string;
  deliveryDate: string;
  receiver: string;
}

/**
 * Export a complete delivery note to Excel matching the print layout.
 */
export async function exportDeliveryNote(items: DeliveryItem[], meta: NoteMeta) {
  const XLSX = await loadXLSX();

  const COLUMNS = 7;
  const HEADER = ["序号", "订单号", "料号", "品名", "数量", "单价", "金额"];

  const aoa: (string | number)[][] = [];

  // --- Header ---
  aoa.push([meta.companyName]);
  aoa.push([meta.companyEn]);
  aoa.push(["送  货  单"]);
  aoa.push([]);

  // --- Info line ---
  aoa.push([
    `客户：${meta.customerName}`,
    `地址：${meta.customerAddress}`,
    "",
    "",
    `单号：${meta.deliveryNumber}`,
    `日期：${meta.deliveryDate}`,
    "",
  ]);
  aoa.push([]);

  // --- Table header ---
  aoa.push(HEADER);

  // --- Table body ---
  const total = items.reduce((s, it) => s + Number(it.amount), 0);
  for (const it of items) {
    aoa.push([
      it.seq,
      it.order_number || "",
      it.material_code || "",
      it.product_name,
      it.quantity,
      Number(it.unit_price),
      Number(it.amount),
    ]);
  }

  // Pad to 8 rows
  while (aoa.length < 8 + 8) {
    aoa.push(["", "", "", "", "", "", ""]);
  }

  // --- Total ---
  aoa.push(["", "", "", "合  计", "", "", total]);
  aoa.push([]);
  aoa.push([`收货单位及经手人：${meta.receiver || "_______________"}`]);
  aoa.push(["送货单位及经手人：_______________"]);

  // Build sheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge header rows across all 7 columns
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COLUMNS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COLUMNS - 1 } },
  ];

  // Column widths (equal distribution)
  ws["!cols"] = Array.from({ length: COLUMNS }, () => ({ wch: 16 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "送货单");
  XLSX.writeFile(wb, `${meta.customerName}_${meta.deliveryNumber}.xlsx`);
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
