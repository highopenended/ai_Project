import { useState } from "react";
import { useTraitContext, TRAIT_STATES } from "../context/TraitContext";
import traitList from "../../../../../public/trait-list.json";
import TagContainer from "../components/TagContainer";
import Section from "../components/Section";
import ButtonGroup from "../components/ButtonGroup";
import SearchBar from '../components/SearchBar';

function TraitFilter() {
    const { getTraitState, toggleTrait, clearTraitSelections } = useTraitContext();

    const [traitFilter, setTraitFilter] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Filter traits based on search and remove duplicates
    const filteredTraits = Array.from(
        new Set(
            traitList
                .map((trait) => trait.Trait)
                .filter((trait) => trait.toLowerCase().includes(traitFilter.toLowerCase()))
        )
    ).sort();

    // Ensure getTraitState returns a string
    const getTraitStateString = (trait) => {
        const state = getTraitState(trait);
        return state === TRAIT_STATES.INCLUDE ? "INCLUDE" : state === TRAIT_STATES.EXCLUDE ? "EXCLUDE" : "NONE";
    };

    // console.log('Filtered Traits:', filteredTraits);
    // console.log('Trait States:', filteredTraits.map(trait => ({ trait, state: getTraitStateString(trait) })));

    // Define getTagClassName function
    const getTagClassName = (state) => {
        const baseClass = "tag";
        if (state === "INCLUDE") return `${baseClass} included`;
        if (state === "EXCLUDE") return `${baseClass} excluded`;
        return baseClass;
    };

    return (
        <Section
            title="Traits"
            buttonGroup={
                <ButtonGroup
                    handleReset={clearTraitSelections}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
            }
        >
            {!isCollapsed && (
                <>
                    <SearchBar
                        placeholder="Search traits..."
                        value={traitFilter}
                        onChange={(e) => setTraitFilter(e.target.value)}
                        className="search-input"
                    />
                    <TagContainer
                        tags={filteredTraits.map((trait) => ({
                            name: trait,
                            state: getTraitStateString(trait),
                            count: 0, // Assuming count is not used here
                        }))}
                        onTagClick={toggleTrait}
                        getTagClassName={getTagClassName}
                    />
                </>
            )}
        </Section>
    );
}

export default TraitFilter;
