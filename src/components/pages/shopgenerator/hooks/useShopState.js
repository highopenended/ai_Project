import { useState, useCallback } from 'react';
import { SELECTION_STATES } from '../utils/shopGeneratorConstants';
import defaultShopData from '../utils/shopData';

/**
 * Helper function to get current shop state including parameters, details, and filterMaps
 */
export const getCurrentShopState = (shopState, filterMaps, items, getFilteredArray) => ({
    
    // Shop details
    id: shopState.id,
    name: shopState.name,
    keeperName: shopState.keeperName,
    type: shopState.type,
    location: shopState.location,
    description: shopState.description,
    keeperDescription: shopState.keeperDescription,
    dateCreated: shopState.dateCreated,
    dateLastEdited: shopState.dateLastEdited,
    
    // Shop parameters
    gold: shopState.gold,
    levelRange: {
        min: shopState.levelRange.min,
        max: shopState.levelRange.max
    },
    itemBias: shopState.itemBias,
    rarityDistribution: shopState.rarityDistribution,
    
    // Filter states
    categories: {
        included: getFilteredArray("categories", SELECTION_STATES.INCLUDE),
        excluded: getFilteredArray("categories", SELECTION_STATES.EXCLUDE),
    },
    subcategories: {
        included: getFilteredArray("subcategories", SELECTION_STATES.INCLUDE),
        excluded: getFilteredArray("subcategories", SELECTION_STATES.EXCLUDE),
    },
    traits: {
        included: getFilteredArray("traits", SELECTION_STATES.INCLUDE),
        excluded: getFilteredArray("traits", SELECTION_STATES.EXCLUDE),
    },
    currentStock: items,
});

/**
 * Hook for managing shop state and parameters
 * 
 * Manages the core shop state including generation parameters, shop details,
 * and provides handlers for updating various aspects of the shop state.
 * 
 * @param {Object} initialState - Initial shop state from defaultShopData
 * 
 * @returns {Object} Shop state and handlers
 * @property {Object} shopState - Current shop state
 * @property {Function} setShopState - Function to update the entire shop state
 * @property {Function} handleGoldChange - Handler for updating shop gold
 * @property {Function} handleLowestLevelChange - Handler for updating minimum level
 * @property {Function} handleHighestLevelChange - Handler for updating maximum level
 * @property {Function} handleBiasChange - Handler for updating item bias
 * @property {Function} handleRarityDistributionChange - Handler for updating rarity distribution
 * @property {Function} handleShopDetailsChange - Handler for updating shop details
 * @property {Function} handleRevertChanges - Handler for resetting state to a snapshot
 */
export const useShopState = (initialState) => {
    const [shopState, setShopState] = useState({
        // Shop parameters
        gold: initialState.gold || defaultShopData.gold,
        levelRange: initialState.levelRange || defaultShopData.levelRange,
        itemBias: initialState.itemBias || defaultShopData.itemBias,
        rarityDistribution: initialState.rarityDistribution || defaultShopData.rarityDistribution,
        
        // Shop details
        id: initialState.id || defaultShopData.id,
        name: initialState.name || defaultShopData.name,
        keeperName: initialState.keeperName || defaultShopData.keeperName,
        type: initialState.type || defaultShopData.type,
        location: initialState.location || defaultShopData.location,
        description: initialState.description || defaultShopData.description,
        keeperDescription: initialState.keeperDescription || defaultShopData.keeperDescription,
        dateCreated: initialState.dateCreated || defaultShopData.dateCreated,
        dateLastEdited: initialState.dateLastEdited || defaultShopData.dateLastEdited,
    });

    // Parameter handlers
    const handleGoldChange = (gold) => {
        setShopState(prev => ({ ...prev, gold }));
    };

    const handleLowestLevelChange = (min) => {
        setShopState(prev => ({
            ...prev,
            levelRange: { ...prev.levelRange, min },
        }));
    };

    const handleHighestLevelChange = (max) => {
        setShopState(prev => ({
            ...prev,
            levelRange: { ...prev.levelRange, max },
        }));
    };

    const handleBiasChange = (bias) => {
        console.log("handleBiasChange called with:", {
            newBias: bias,
            prevState: shopState
        });
        setShopState(prev => {
            const newState = { ...prev, itemBias: bias };
            console.log("New state after bias update:", newState);
            return newState;
        });
    };

    const handleRarityDistributionChange = (distribution) => {
        setShopState(prev => ({ ...prev, rarityDistribution: distribution }));
    };

    // Shop details handlers
    const handleShopDetailsChange = (e) => {
        console.log("handleShopDetailsChange called with:", {
            name: e.target.name,
            value: e.target.value,
            prevState: shopState
        });
        
        const { name, value } = e.target;
        setShopState(prev => {
            const newState = { ...prev };
            
            switch (name) {
                case "shopName":
                    console.log("Updating shop name from", newState.name, "to", value);
                    newState.name = value;
                    break;
                case "shopKeeperName":
                    console.log("Updating keeper name from", newState.keeperName, "to", value);
                    newState.keeperName = value;
                    break;
                case "type":
                    console.log("Updating type from", newState.type, "to", value);
                    newState.type = value;
                    break;
                case "location":
                    console.log("Updating location from", newState.location, "to", value);
                    newState.location = value;
                    break;
                case "shopDetails":
                    console.log("Updating description from", newState.description, "to", value);
                    newState.description = value;
                    break;
                case "shopKeeperDetails":
                    console.log("Updating keeper description from", newState.keeperDescription, "to", value);
                    newState.keeperDescription = value;
                    break;
                default:
                    console.warn("Unknown field name:", name);
                    return prev;
            }
            
            newState.dateLastEdited = new Date();
            console.log("Final state update:", newState);
            return newState;
        });
    };

    /**
     * Reset all state to match the last snapshot
     */
    const handleRevertChanges = useCallback(async (snapshot, setFilterMaps, setItems) => {
        if (!snapshot) return;

        try {
            // Reset all state to match the snapshot
            await Promise.all([
                setShopState({
                    id: snapshot.id,
                    name: snapshot.name,
                    keeperName: snapshot.keeperName,
                    type: snapshot.type,
                    location: snapshot.location,
                    description: snapshot.description,
                    keeperDescription: snapshot.keeperDescription,
                    dateCreated: snapshot.dateCreated,
                    dateLastEdited: snapshot.dateLastEdited,
                    gold: snapshot.gold,
                    levelRange: snapshot.levelRange,
                    itemBias: snapshot.itemBias,
                    rarityDistribution: snapshot.rarityDistribution,
                }),
                setFilterMaps?.({
                    categories: new Map(Object.entries(snapshot.filterStorageObjects.categories)),
                    subcategories: new Map(Object.entries(snapshot.filterStorageObjects.subcategories)),
                    traits: new Map(Object.entries(snapshot.filterStorageObjects.traits)),
                }),
                setItems?.(snapshot.currentStock),
            ]);
        } catch (error) {
            console.error("Error resetting changes:", error);
            alert("Error resetting changes. Please try again.");
        }
    }, []);

    return {
        shopState,
        setShopState,
        // Parameter handlers
        handleGoldChange,
        handleLowestLevelChange,
        handleHighestLevelChange,
        handleBiasChange,
        handleRarityDistributionChange,
        // Shop details handlers
        handleShopDetailsChange,
        // Reset handler
        handleRevertChanges,
    };
}; 