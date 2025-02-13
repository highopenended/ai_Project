// import React from 'react';
import ItemTable from './tab_inventorytable/ItemTable';
import { useShopGenerator } from '../../../../context/ShopGeneratorContext';
import './Tab_InventoryTable.css';

Tab_InventoryTable.displayName = "Inventory Table";
Tab_InventoryTable.minWidth = 400;

function Tab_InventoryTable({ items, sortConfig, onSort, currentShop }) {
    return (
        <div>
            Inventory Table
            <ItemTable
                items={items}
                sortConfig={sortConfig}
                onSort={onSort}
                currentShop={currentShop || "Unnamed Shop"}
            />
        </div>
    );
}

export default Tab_InventoryTable;
