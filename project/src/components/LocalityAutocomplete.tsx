import { useState, useEffect, useRef } from "react";
import { MapPin, Search, X } from "lucide-react";
import { areasApi, KathmanduArea } from "../api/areas";

interface LocalityAutocompleteProps {
  value: string;
  onChange: (value: string, area: KathmanduArea | null) => void;
  placeholder?: string;
  className?: string;
}

export function LocalityAutocomplete({
  value,
  onChange,
  placeholder = "Search Kathmandu localities...",
  className = "",
}: LocalityAutocompleteProps) {
  const [areas, setAreas] = useState<KathmanduArea[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<KathmanduArea[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load all areas on mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await areasApi.getAll();
        const areasList = response.data.areas || [];
        setAreas(areasList);
        setFilteredAreas(areasList);
      } catch (error) {
        console.error("Failed to load areas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  // Filter areas based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredAreas(areas);
      return;
    }

    const searchTerm = value.toLowerCase().trim();
    const filtered = areas.filter((area) => {
      const nameMatch = area.name.toLowerCase().includes(searchTerm);
      const slugMatch = area.slug.toLowerCase().includes(searchTerm);
      const districtMatch = area.district.toLowerCase().includes(searchTerm);
      
      // Handle common spelling variants
      const variants: Record<string, string[]> = {
        boudha: ["bouddha", "bodha"],
        bouddha: ["boudha", "bodha"],
        thamel: ["thammel"],
        chabahil: ["chabhil", "chabahel"],
      };

      const variantMatch = Object.entries(variants).some(([key, alts]) => {
        if (area.slug === key) {
          return alts.some((alt) => alt.includes(searchTerm));
        }
        return false;
      });

      return nameMatch || slugMatch || districtMatch || variantMatch;
    });

    setFilteredAreas(filtered);
  }, [value, areas]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (area: KathmanduArea) => {
    onChange(area.name, area);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("", null);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value, null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading localities...
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No localities found
            </div>
          ) : (
            <ul>
              {filteredAreas.map((area) => (
                <li key={area.slug}>
                  <button
                    onClick={() => handleSelect(area)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 transition"
                  >
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {area.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {area.district}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
