import { useState } from "react";
import PropTypes from 'prop-types';
import Section from "../../../shared/section/Section";
import MiniButtonGroup from "../../../shared/minibuttongroup/MiniButtonGroup";
import SearchBar from "../../../shared/searchbar/SearchBar";
import TagContainer from "../../../shared/TagContainer";

function CategoryFilter({ categoryData, getFilterState, toggleCategory, clearCategorySelections }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCategories = Object.entries(categoryData.categories)
        .filter(([category]) =>
            category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category]) => ({
            name: category
        }));

    return (
        <Section
            title="Categories"
            miniButtonGroup={
                <MiniButtonGroup handleReset={clearCategorySelections} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            }
        >
            {!isCollapsed && (
                <SearchBar
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            )}
            {!isCollapsed && (
                <TagContainer
                    tags={filteredCategories}
                    onTagClick={toggleCategory}
                    getTagState={(category) => getFilterState('categories', category)}
                />
            )}
        </Section>
    );
}

CategoryFilter.propTypes = {
    categoryData: PropTypes.object.isRequired,
    getFilterState: PropTypes.func.isRequired,
    toggleCategory: PropTypes.func.isRequired,
    clearCategorySelections: PropTypes.func.isRequired
};

export default CategoryFilter;
