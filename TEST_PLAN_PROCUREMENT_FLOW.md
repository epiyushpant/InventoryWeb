# Test Plan: Procurement & Inventory Flow

This plan outlines the steps to verify the end-to-end flow from internal requisition to stock update.

## Phase 1: Purchase Requisition (PR)
1. **Navigate** to `Purchase Requisitions` in the sidebar.
2. **Click** "New Requisition".
3. **Fill in** details:
   - Requested By: "Test User"
   - Product: Select any product (e.g., "Industrial Laptop")
   - Quantity: `10`
   - Required Date: Set a future date.
4. **Submit** the request.
5. **Verify** the request appears in the list with a "Pending" status.
6. *(Optional)* Manually approve the request in the database or via API if an approval UI doesn't exist, as the PO form filters for "Approved" PRs.

## Phase 2: Purchase Order (PO)
1. **Navigate** to `Purchase Orders`.
2. **Click** "Create Purchase Order".
3. **Select** the PR you just created from the "Purchase Requisition (Optional)" dropdown.
4. **Verify** that:
   - The line items are auto-filled with the product and quantity (10) from the PR.
   - The "PO ID" in the list view (after saving) shows "From #PR-X".
5. **Select** a Supplier and **Save** the Order.
6. **Change** the status to "Completed" and save again.
7. **Check Inventory:** Verify that the inventory has **NOT** increased yet (since inventory is now only updated via GRN).

## Phase 3: Goods Received Note (GRN)
1. **Navigate** to `GRNs` (Goods Received Notes).
2. **Click** "Receive Goods".
3. **Select** the Purchase Order created in Phase 2 from the dropdown.
4. **Select** the Product. 
   - **Verify** that only products from that specific PO are visible.
   - **Verify** that the "Received Qty" auto-fills from the PO.
5. **Select** a Warehouse (Location).
6. **Save GRN**.
7. **Verify** the alert "GRN saved successfully. Inventory updated." appears.

## Phase 4: Inventory & Movement Verification
1. **Navigate** to `Inventories`.
2. **Locate** the product received.
3. **Verify** that the "Quantity On Hand" has increased by the amount specified in the GRN.
4. **Navigate** to `Stock Movements` (if available in the UI, or check API `/api/StockMovements`).
5. **Verify** a new movement entry exists:
   - **Type:** `GRN`
   - **Quantity:** `+10`
   - **Reference:** `GRN-X (PO-Y)`

## Troubleshooting
- **Double Counting:** If inventory increases when changing PO status to "Completed", check `PurchaseOrderRepository.cs` to ensure the status change block is commented out/removed.
- **Empty Dropdowns:** Ensure the API servers (Backend: 5201, Frontend: 3000) are running and the database is reachable.
