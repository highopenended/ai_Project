import PropTypes from 'prop-types';
import './Tab_ChooseShop.css';
import NewShopButton from './NewShopButton';
import SavedShops from './SavedShops';
import ImportExport from './ImportExport';

/**
 * Tab_ChooseShop Component
 * 
 * Manages the shop selection interface, including:
 * - Creating new shops
 * - Loading saved shops
 * - Importing/Exporting shop data
 */
function Tab_ChooseShop({ savedShops, onLoadShop, onNewShop }) {
    return (
        <div className="tab-choose-shop">
            <NewShopButton handleNewShop={onNewShop} />
            <SavedShops 
                savedShops={savedShops} 
                loadShop={onLoadShop} 
                handleNewShop={onNewShop}
            />
            <ImportExport 
                handleImportShop={() => {}} 
                handleExportShop={() => {}} 
                shopData={{}}
            />
        </div>
    );
};

Tab_ChooseShop.propTypes = {
    savedShops: PropTypes.array.isRequired,
    onLoadShop: PropTypes.func.isRequired,
    onNewShop: PropTypes.func.isRequired,
};

Tab_ChooseShop.displayName = "Choose Shop";
Tab_ChooseShop.minWidth = 220;

export default Tab_ChooseShop;
