import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import Tab from './tab.jsx';
import './TabContainer.css';

/**
 * Custom hook to debounce function calls.
 * Prevents rapid-fire function execution by waiting for a pause in calls.
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds before executing the function
 * @returns {Function} A debounced version of the callback
 */
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedCallback;
}

/**
 * TabContainer Component
 * Manages a group of draggable tabs with support for:
 * - Drag and drop reordering within the same group
 * - Moving tabs between groups
 * - Creating new groups by dragging to edges
 * - Visual feedback during drag operations
 * 
 * State Management:
 * - activeTab: Currently selected tab in this group
 * - dropIndex: Current position where a dragged tab would be inserted
 * - tabRefs: References to tab DOM elements for position calculations
 * - originalPositions: Cached positions of tabs when drag starts
 * 
 * Key Behaviors:
 * 1. Drag Start: Caches original positions and sets up drag data
 * 2. Drag Over: Calculates drop positions and shows indicators
 * 3. Drop: Handles tab movement/reordering
 * 4. Drag End: Cleans up state and visual indicators
 * 
 * Common Issues & Solutions:
 * 1. Tabs jumping during drag: Check originalPositions and getTabStyle
 * 2. Incorrect drop positions: Verify dropIndex calculations
 * 3. Visual glitches: Ensure proper cleanup in handleDragEnd
 * 4. State inconsistencies: Check parent-child state sync
 */
function TabContainer({ 
    tabs, 
    onTabMove, 
    onTabSplit, 
    groupIndex,
    draggedTab,
    draggedTabIndex,
    dropIndicators,
    onDragStart,
    onDragEnd,
    onDropIndicatorChange,
    onTabClick
}) {
    // Local state for this tab group
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [dropIndex, setDropIndex] = useState(null);
    
    // Refs for DOM manipulation and position tracking
    const tabRefs = useRef({});  // Stores references to tab DOM elements
    const originalPositions = useRef([]); // Caches tab positions at drag start
    const edgeThreshold = 40; // Distance from edge to trigger group split
    const edgeHoldTimeout = useRef(null);

    // Keep active tab valid when tabs array changes
    useEffect(() => {
        if (!tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [tabs, activeTab]);

    // Debounce indicator changes to prevent rapid updates
    const debouncedDropIndicatorChange = useDebounce((indicators) => {
        onDropIndicatorChange(indicators);
    }, 50);

    /**
     * Handles tab selection
     * @param {Object} tab - The tab being clicked
     */
    const handleTabClick = (tab) => {
        setActiveTab(tab);
        onTabClick?.(tab, tabs.indexOf(tab));
    };

    /**
     * Initializes drag operation
     * Caches original positions and sets up drag data
     */
    const handleDragStart = (e, tab, index) => {
        // Safety check for tab structure
        if (!tab || !tab.type) {
            return;
        }

        const tabElements = Array.from(e.currentTarget.parentElement.children);
        originalPositions.current = tabElements.map(tab => {
            const rect = tab.getBoundingClientRect();
            return {
                left: rect.left,
                right: rect.right,
                width: rect.width,
                center: rect.left + rect.width / 2
            };
        });
        
        onDragStart(tab, index);
        
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.setData('groupIndex', groupIndex.toString());
        e.dataTransfer.setData('tabInfo', JSON.stringify({
            type: tab.type.name,
            index: index,
            key: tab.key
        }));
    };

    /**
     * Handles drag over events
     * Calculates drop positions and updates indicators
     * Uses debouncing to prevent excessive updates
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Get header area bounds
        const headerRect = e.currentTarget.querySelector('.tab-header').getBoundingClientRect();
        const isOverHeader = mouseY >= headerRect.top && mouseY <= headerRect.bottom;
        
        if (mouseY >= containerRect.top && mouseY <= containerRect.bottom) {
            const distanceFromLeft = mouseX - containerRect.left;
            const distanceFromRight = containerRect.right - mouseX;

            const containerParent = e.currentTarget.parentElement;
            const allGroups = Array.from(containerParent.children);
            const currentGroupIndex = allGroups.indexOf(e.currentTarget);
            const isFirstGroup = currentGroupIndex === 0;
            const isLastGroup = currentGroupIndex === allGroups.length - 1;

            // Only show split indicators when NOT over the header
            const newIndicators = {
                leftGroup: !isOverHeader && isFirstGroup && distanceFromLeft < edgeThreshold ? groupIndex : null,
                rightGroup: !isOverHeader && isLastGroup && distanceFromRight < edgeThreshold ? groupIndex : null,
                betweenGroups: !isOverHeader && (!isFirstGroup && distanceFromLeft < edgeThreshold || !isLastGroup && distanceFromRight < edgeThreshold) ? groupIndex : null
            };
            
            // Use the debounced version for indicator changes
            debouncedDropIndicatorChange(newIndicators);

            // Calculate drop index using originalPositions for smooth animations
            const relativeX = mouseX - headerRect.left;
            let newDropIndex = tabs.length;
            
            if (originalPositions.current.length > 0) {
                if (relativeX < originalPositions.current[0]?.center - headerRect.left) {
                    newDropIndex = 0;
                } else {
                    for (let i = 1; i < originalPositions.current.length; i++) {
                        const prevCenter = originalPositions.current[i - 1]?.center - headerRect.left;
                        const currentCenter = originalPositions.current[i]?.center - headerRect.left;
                        
                        if (relativeX >= prevCenter && relativeX < currentCenter) {
                            newDropIndex = i;
                            break;
                        }
                    }
                }
            }

            // Ensure dropIndex doesn't exceed current group's length
            newDropIndex = Math.min(newDropIndex, tabs.length);

            // When creating a new group, default to index 0
            if (!isOverHeader && (newIndicators.leftGroup !== null || 
                newIndicators.rightGroup !== null || 
                newIndicators.betweenGroups !== null)) {
                newDropIndex = 0;
            }
            
            if (dropIndex !== newDropIndex) {
                setDropIndex(newDropIndex);
            }
        }
    };

    const handleDragLeave = (e) => {
        const containerRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const isOutsideContainer = 
            mouseX < containerRect.left ||
            mouseX > containerRect.right ||
            mouseY < containerRect.top ||
            mouseY > containerRect.bottom;
            
        if (isOutsideContainer) {
            onDropIndicatorChange({
                leftGroup: null,
                rightGroup: null,
                betweenGroups: null
            });
            if (edgeHoldTimeout.current) {
                clearTimeout(edgeHoldTimeout.current);
                edgeHoldTimeout.current = null;
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const sourceGroupIndex = parseInt(e.dataTransfer.getData('groupIndex'));
        const tabInfo = JSON.parse(e.dataTransfer.getData('tabInfo'));
        
        const wasShowingLeftIndicator = dropIndicators.leftGroup === groupIndex;
        const wasShowingRightIndicator = dropIndicators.rightGroup === groupIndex;
        const wasShowingBetweenIndicator = dropIndicators.betweenGroups === groupIndex;
        
        onDropIndicatorChange({
            leftGroup: null,
            rightGroup: null,
            betweenGroups: null
        });
        
        if (wasShowingBetweenIndicator) {
            onTabSplit(tabInfo, sourceGroupIndex, groupIndex);
        }
        else if (wasShowingLeftIndicator || wasShowingRightIndicator) {
            onTabSplit(tabInfo, sourceGroupIndex, wasShowingRightIndicator);
        }
        else if (sourceGroupIndex !== groupIndex) {
            const targetIndex = dropIndex !== null ? dropIndex : tabs.length;
            onTabMove([draggedTab, targetIndex], sourceGroupIndex, groupIndex);
        }
        else if (sourceIndex !== dropIndex && dropIndex !== null) {
            const newTabs = [...tabs];
            const [movedTab] = newTabs.splice(sourceIndex, 1);
            newTabs.splice(dropIndex, 0, movedTab);
            onTabMove(newTabs, groupIndex);
            if (activeTab === tabs[sourceIndex]) {
                setActiveTab(movedTab);
            }
        }

        setDropIndex(null);
    };

    /**
     * Cleans up after drag operation ends
     * Resets all drag-related state
     */
    const handleDragEnd = () => {
        setDropIndex(null);
        onDragEnd();
        if (edgeHoldTimeout.current) {
            clearTimeout(edgeHoldTimeout.current);
            edgeHoldTimeout.current = null;
        }
        delete window.__draggedTab;
    };

    /**
     * Calculates styles for tabs during drag operations
     * Handles visibility and position transforms
     * 
     * @param {number} index - Index of the tab to style
     * @returns {Object} Style object for the tab
     */
    const getTabStyle = (index) => {
        // Only hide the dragged tab in its original group
        if (draggedTabIndex === null || dropIndex === null || draggedTab === null) return {};
        
        // Get the original positions of tabs in this group
        const currentGroupTabs = originalPositions.current;
        if (!currentGroupTabs || currentGroupTabs.length === 0) return {};
        
        // Only apply visibility:hidden in the source group where the drag started
        if (draggedTab.key && tabs[index]?.key === draggedTab.key) {
            return { visibility: 'hidden' };
        }
        
        const tabElement = tabRefs.current[index];
        if (!tabElement) return {};
        
        const draggedRect = tabRefs.current[draggedTabIndex]?.getBoundingClientRect();
        const tabWidth = draggedRect ? draggedRect.width : 0;
        
        // Only move tabs if they're in the same group as the dragged tab
        const isDraggedTabInThisGroup = tabs.some(tab => tab.key === draggedTab.key);
        
        if (!isDraggedTabInThisGroup) return {};
        
        if (draggedTabIndex < dropIndex) {
            if (index > draggedTabIndex && index <= dropIndex) {
                return { transform: `translateX(-${tabWidth}px)` };
            }
        } else if (draggedTabIndex > dropIndex) {
            if (index >= dropIndex && index < draggedTabIndex) {
                return { transform: `translateX(${tabWidth}px)` };
            }
        }
        
        return {};
    };

    return (
        <div 
            className={`tab-container ${dropIndicators.leftGroup === groupIndex ? 'show-left-indicator' : ''} ${dropIndicators.rightGroup === groupIndex ? 'show-right-indicator' : ''} ${dropIndicators.betweenGroups === groupIndex ? 'show-between-indicator' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="tab-header">
                {tabs.map((tab, index) => {
                    if (!tab || !tab.type) {
                        return null;
                    }

                    const tabKey = tab.key || `tab-${tab.type.name || 'unknown'}-${index}`;
                    
                    return (
                        <Tab
                            key={tabKey}
                            tab={tab}
                            index={index}
                            isActive={tab === activeTab}
                            isDragging={draggedTab === tab}
                            isDropTarget={dropIndex === index}
                            tabRef={el => tabRefs.current[index] = el}
                            style={getTabStyle(index)}
                            onTabClick={handleTabClick}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        />
                    );
                })}
            </div>
            <div className="tab-content">
                {activeTab}
            </div>
        </div>
    );
}

TabContainer.propTypes = {
    /** Array of tab components to render */
    tabs: PropTypes.arrayOf(PropTypes.node).isRequired,
    /** Callback when tabs are reordered or moved between groups */
    onTabMove: PropTypes.func.isRequired,
    /** Callback when a new group should be created */
    onTabSplit: PropTypes.func.isRequired,
    /** Index of this tab group */
    groupIndex: PropTypes.number.isRequired,
    /** Currently dragged tab */
    draggedTab: PropTypes.node,
    /** Index of currently dragged tab */
    draggedTabIndex: PropTypes.number,
    /** Visual indicators for group splitting */
    dropIndicators: PropTypes.shape({
        leftGroup: PropTypes.number,
        rightGroup: PropTypes.number,
        betweenGroups: PropTypes.number
    }).isRequired,
    /** Callback when drag starts */
    onDragStart: PropTypes.func.isRequired,
    /** Callback when drag ends */
    onDragEnd: PropTypes.func.isRequired,
    /** Callback to update drop indicators */
    onDropIndicatorChange: PropTypes.func.isRequired,
    /** Callback when a tab is clicked */
    onTabClick: PropTypes.func
};

export default TabContainer;
