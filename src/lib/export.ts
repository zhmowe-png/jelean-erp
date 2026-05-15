import * as XLSX from "xlsx";
import type { DeliveryItem } from "../types";

interface ExportRow {
  序号: number;
  订单号: string;
  料号: string;
  品名: string;
  数量: number;
  单价: number;
  金额: number;
  备注: string;
}

/**
 * Export delivery items to Excel with proper filename.
 * @param items — delivery line items
 * @param customerName — customer company name
 * @param deliveryNumber — delivery note number (e.g. "SDN2026001")
 */
export function exportDeliveryNote(
  items: (DeliveryItem & { notes?: string | null })[],
  customerName: string,
  deliveryNumber: string,
) {
  const rows: ExportRow[] = items.map((it) => ({
    序号: it.seq,
    订单号: it.order_number || "",
    料号: it.material_code || "",
    品名: it.product_name,
    数量: it.quantity,
    单价: Number(it.unit_price),
    金额: Number(it.amount),
    备注: it.notes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 },  // 序号
    { wch: 14 }, // 订单号
    { wch: 12 }, // 料号
    { wch: 20 }, // 品名
    { wch: 8 },  // 数量
    { wch: 10 }, // 单价
    { wch: 12 }, // 金额
    { wch: 20 }, // 备注
  ];

  const total = items.reduce((s, it) => s + Number(it.amount), 0);
  XLSX.utils.sheet_add_aoa(ws, [[
    "", "", "", "合计", "", "", total, "",
  ]], { origin: -1 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "送货单");
  XLSX.writeFile(wb, `${customerName}_${deliveryNumber}.xlsx`);
}

interface BillingExportRow {
  送货单号: string;
  送货日期: string;
  序号: number;
  订单号: string;
  料号: string;
  品名: string;
  数量: number;
  单价: number;
  金额: number;
}

/**
 * Export billing statement to Excel.
 */
export function exportBilling(
  rows: (DeliveryItem & { delivery_number: string; delivery_date: string })[],
  customerName: string,
  yearMonth: string,
) {
  const data: BillingExportRow[] = rows.map((r) => ({
    送货单号: r.delivery_number,
    送货日期: r.delivery_date,
    序号: r.seq,
    订单号: r.order_number || "",
    料号: r.material_code || "",
    品名: r.product_name,
    数量: r.quantity,
    单价: Number(r.unit_price),
    金额: Number(r.amount),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 14 }, // 送货单号
    { wch: 12 }, // 送货日期
    { wch: 6 },  // 序号
    { wch: 14 }, // 订单号
    { wch: 12 }, // 料号
    { wch: 20 }, // 品名
    { wch: 8 },  // 数量
    { wch: 10 }, // 单价
    { wch: 12 }, // 金额
  ];

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  XLSX.utils.sheet_add_aoa(ws, [[
    "", "", "", "", "", "", "", "合计", total,
  ]], { origin: -1 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "对账单");
  XLSX.writeFile(wb, `${customerName}_${yearMonth}.xlsx`);
}
