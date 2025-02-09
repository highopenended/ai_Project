import { useState } from 'react';
import PropTypes from 'prop-types';
import './CloneShopButton.css';

/**
 * CloneShopButton Component
 * 
 * A button component that creates a clone of the current shop with a new ID.
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onClone - Callback function to handle shop cloning
 * @param {string} props.shopId - Current shop ID for display
 */
const CloneShopButton = ({ onClone, shopId }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleCloneClick = () => {
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        onClone();
        setShowConfirm(false);
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    return (
        <>
            <button 
                className="clone-shop-button"
                onClick={handleCloneClick}
                aria-label="Clone shop"
            >
                <span className="clone-icon">⧉</span>
                <span className="clone-text">Clone Shop</span>
            </button>
            {shopId && <span className="shop-id">ID: {shopId}</span>}

            {showConfirm && (
                <div className="clone-confirm-overlay" onClick={handleCancel}>
                    <div className="clone-confirm-dialog" onClick={e => e.stopPropagation()}>
                        <h3 className="clone-confirm-title">Clone This Shop?</h3>
                        <p className="clone-confirm-message">
                            This will create an exact copy of the current shop with a new ID. 
                            The cloned shop will have "(Clone)" appended to its name.
                        </p>
                        <div className="clone-confirm-buttons">
                            <button 
                                className="clone-confirm-button clone-confirm-cancel"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button 
                                className="clone-confirm-button clone-confirm-proceed"
                                onClick={handleConfirm}
                            >
                                Clone Shop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

CloneShopButton.propTypes = {
    onClone: PropTypes.func.isRequired,
    shopId: PropTypes.string
};

export default CloneShopButton; 