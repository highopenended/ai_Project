import PropTypes from 'prop-types';
import './Tag.css';

const Tag = ({ name, state, onClick }) => {
    const getTagClassName = (state) => {

        const baseClass = 'tag';
        if (state === 'INCLUDE') return `${baseClass} included`;
        if (state === 'EXCLUDE') return `${baseClass} excluded`;
        return baseClass;
    };

    return (
        <button className={getTagClassName(state)} onClick={onClick}> {name}</button>
    );
};

Tag.propTypes = {
    name: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default Tag;
