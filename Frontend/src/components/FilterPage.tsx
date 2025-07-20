// Redesigned UI with same functionality
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

export type FilterOptionsState = {
  id: string;
  label: string;
};

const filterOptions: FilterOptionsState[] = [
  { id: "burger", label: "Burger" },
  { id: "thali", label: "Thali" },
  { id: "biryani", label: "Biryani" },
  { id: "momos", label: "Momos" },
];

const FilterPage = () => {
  const { setAppliedFilter, appliedFilter, resetAppliedFilter } =
    useRestaurantStore();

  const appliedFilterHandler = (value: string) => {
    setAppliedFilter(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 top-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Filter by Cuisine
        </h2>
        <Button variant="link" className="text-sm" onClick={resetAppliedFilter}>
          Reset
        </Button>
      </div>
      <div className="space-y-4">
        {filterOptions.map((option) => (
          <div key={option.id} className="flex items-center gap-3">
            <Checkbox
              id={option.id}
              checked={appliedFilter.includes(option.label)}
              onClick={() => appliedFilterHandler(option.label)}
            />
            <Label
              htmlFor={option.id}
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPage;
