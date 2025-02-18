import { useState } from "react";
import PropTypes from "prop-types";
import "./SaveShopButton.css";
import UnsavedChangesDialogue from "../../../shared/UnsavedChangesDialogue";

const SaveShopButton = ({ onSave, areAllDetailsFilled, changes, currentShop }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        onSave();
        setShowConfirmation(false);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
    };

    return (
        <>
            <button 
                className="save-shop-button"
                onClick={handleClick} 
                disabled={!areAllDetailsFilled()} 
                aria-label="Save"
            >
                <span className="save-icon">&#128427;</span>
                <span className="save-text">Save</span>
            </button>
        {showConfirmation && (
            <UnsavedChangesDialogue
                headerText="Save All Changes?"
                description={`Are you sure you want to save the changes you've made to this shop (${currentShop.name})?`}
                changes={changes}
                currentShopName={currentShop.name}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmButtonText="Reset Changes"
            />
        )}
        </>
    );
};

SaveShopButton.propTypes = {
    onSave: PropTypes.func.isRequired,
    areAllDetailsFilled: PropTypes.func.isRequired,
    changes: PropTypes.object.isRequired,
    currentShop: PropTypes.object.isRequired,
};

export default SaveShopButton;
