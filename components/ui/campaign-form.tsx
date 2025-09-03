"use client";

import { useState, ChangeEvent, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CampaignStatus, MediaType } from "@/schemas/campaign.schema";
import { ImageIcon, Upload, X, AlertCircle, Info, Clock, Search, Check } from "lucide-react";
import Image from "next/image";
import { formatCurrency, getCurrencyCode } from "@/lib/currency-config";

const categoriesList = [
  "Gaming",
  "Music",
  "Tech",
  "Beauty",
  "Fashion",
  "Food",
  "Lifestyle",
  "Travel",
  "Education",
  "Fitness",
  "Business",
  "Entertainment",
  "Sports",
  "Art",
  "News",
  "Science",
  "Health",
  "Finance",
  "Politics",
  "Comedy",
  "Drama",
  "Documentary",
  "Animation",
  "Horror",
  "Romance",
  "Action",
  "Adventure",
  "Fantasy",
  "Sci-Fi",
];

const popularCategories = ["Gaming", "Tech", "Lifestyle", "Entertainment", "Music", "Sports"];

const languagesList = [
  "Hindi",
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Czech",
  "Hungarian",
  "Turkish",
  "Greek",
  "Hebrew",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malay",
  "Romanian",
  "Bulgarian",
  "Croatian",
];

const popularLanguages = ["English", "Spanish", "French", "German", "Chinese", "Japanese"];

interface CampaignFormData {
  title: string;
  description: string;
  budget: number;
  paymentRate: number;
  paymentType: "fixed" | "cpm" | "cpc";
  categories: string[];
  languages: string[];
  mediaUrl: string | null;
  mediaFile: File | null;
  mediaType: MediaType | null;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  gKeyCooloffValue: number; // The numeric value (e.g., 30)
  gKeyCooloffUnit: "hours" | "days" | "months" | "years"; // The time unit
}

// Backend API expects this format
interface CampaignBackendData {
  title: string;
  description: string;
  brandId?: string;
  budget: number;
  mediaUrl: string | null;
  mediaFile?: File | null;
  mediaType: MediaType;
  paymentRate: number;
  paymentType: "fixed" | "cpm";
  categories: string[]; // Backend expects arrays, not strings
  languages: string[]; // Backend expects arrays, not strings
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  gKeyCooloffHours: number; // Backend expects hours
}

interface CampaignFormProps {
  onSubmit: (data: CampaignBackendData) => Promise<void>;
  initialData?: Partial<CampaignFormData> & { gKeyCooloffHours?: number; languages?: string[]; }; // Allow hours from backend
  isEditing?: boolean;
  className?: string;
  isSubmitting: boolean;
}

export function CampaignForm({
  initialData,
  isEditing = false,
  onSubmit,
  isSubmitting,
}: CampaignFormProps) {
  // Helper function to convert hours to value and unit
  const convertHoursToValueUnit = (hours: number): { value: number; unit: "hours" | "days" | "months" | "years" } => {
    if (hours >= 365 * 24) {
      // Years
      return { value: Math.round(hours / (365 * 24)), unit: "years" };
    } else if (hours >= 30 * 24) {
      // Months  
      return { value: Math.round(hours / (30 * 24)), unit: "months" };
    } else if (hours >= 24) {
      // Days
      return { value: Math.round(hours / 24), unit: "days" };
    } else {
      // Hours
      return { value: hours, unit: "hours" };
    }
  };

  const getInitialCooloff = () => {
    if (initialData?.gKeyCooloffHours) {
      return convertHoursToValueUnit(initialData.gKeyCooloffHours);
    }
    return { value: 30, unit: "days" as const };
  };

  const initialCooloff = getInitialCooloff();

  const [formData, setFormData] = useState<CampaignFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    mediaUrl: initialData?.mediaUrl || "",
    mediaType: initialData?.mediaType || MediaType.IMAGE,
    budget: initialData?.budget || (getCurrencyCode() === 'INR' ? 1000 : 10),
    paymentRate: initialData?.paymentRate || (getCurrencyCode() === 'INR' ? 1650 : 20),
    paymentType: initialData?.paymentType || "cpm",
    categories: Array.isArray(initialData?.categories) ? initialData.categories : [],
    languages: Array.isArray(initialData?.languages) ? initialData.languages : [],
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    status: initialData?.status || CampaignStatus.DRAFT,
    gKeyCooloffValue: initialCooloff.value,
    gKeyCooloffUnit: initialCooloff.unit,
    mediaFile: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaPreview, setMediaPreview] = useState<string | null>(
    initialData?.mediaUrl || null
  );
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categoriesList;
    return categoriesList.filter(category =>
      category.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return languagesList;
    return languagesList.filter(language =>
      language.toLowerCase().includes(languageSearch.toLowerCase())
    );
  }, [languageSearch]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Handle number fields
    if (name === "budget" || name === "paymentRate") {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const mediaType = file.type.startsWith("image/")
        ? MediaType.IMAGE
        : MediaType.VIDEO;

      setFormData({
        ...formData,
        mediaFile: file,
        mediaType,
      });

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);

      // Clear error for this field if it exists
      if (errors.mediaUrl) {
        setErrors({
          ...errors,
          mediaUrl: "",
        });
      }
    }
  };

  const handleCategorySelect = (category: string) => {
    // Only allow one category - replace existing selection
    setFormData({
      ...formData,
      categories: [category],
    });

    // Clear error for this field if it exists
    if (errors.categories) {
      setErrors({
        ...errors,
        categories: "",
      });
    }
  };

  const handleCategorySearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCategorySearch(e.target.value);
    setShowCategoryDropdown(true);
  };

  const handleCategoryFromDropdown = (category: string) => {
    handleCategorySelect(category);
    setCategorySearch("");
    setShowCategoryDropdown(false);
  };

  const removeCategoryTag = () => {
    // Clear the selected category
    setFormData({
      ...formData,
      categories: [],
    });
  };

  const handleLanguageSelect = (language: string) => {
    const updatedLanguages = formData.languages.includes(language)
      ? formData.languages.filter((lang) => lang !== language)
      : [...formData.languages, language];

    setFormData({
      ...formData,
      languages: updatedLanguages,
    });

    // Clear error for this field if it exists
    if (errors.languages) {
      setErrors({
        ...errors,
        languages: "",
      });
    }
  };

  const handleLanguageSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLanguageSearch(e.target.value);
    setShowLanguageDropdown(true);
  };

  const handleLanguageFromDropdown = (language: string) => {
    handleLanguageSelect(language);
    setLanguageSearch("");
    setShowLanguageDropdown(false);
  };

  const removeLanguageTag = (languageToRemove: string) => {
    const updatedLanguages = formData.languages.filter((lang) => lang !== languageToRemove);
    setFormData({
      ...formData,
      languages: updatedLanguages,
    });
  };

  const clearMediaPreview = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
    setFormData({
      ...formData,
      mediaFile: null,
      mediaUrl: "",
      mediaType: MediaType.IMAGE,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!mediaPreview && !formData.mediaUrl) {
      newErrors.mediaUrl = "Campaign media is required";
    }

    if (formData.budget <= 0) {
      newErrors.budget = "Budget must be greater than 0";
    }

    if (formData.paymentRate <= 0) {
      newErrors.paymentRate = "Payment rate must be greater than 0";
    }

    if (!formData.categories || formData.categories.length === 0) {
      newErrors.categories = "Please select a category for your campaign";
    }

    if (formData.categories && formData.categories.length > 1) {
      newErrors.categories = "Please select only one category per campaign";
    }

    if (!formData.languages || formData.languages.length === 0) {
      newErrors.languages = "At least one language is required";
    }

    if (!formData.gKeyCooloffValue || formData.gKeyCooloffValue < 1) {
      newErrors.gKeyCooloff = "Cooloff period must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to convert value and unit to hours
  const convertToHours = (value: number, unit: "hours" | "days" | "months" | "years"): number => {
    switch (unit) {
      case "hours":
        return value;
      case "days":
        return value * 24;
      case "months":
        return value * 30 * 24; // Approximate month as 30 days
      case "years":
        return value * 365 * 24; // Approximate year as 365 days
      default:
        return value * 24; // Default to days
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Convert to backend format
      const backendData: CampaignBackendData = {
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        mediaUrl: formData.mediaUrl,
        mediaType: formData.mediaType || MediaType.IMAGE,
        paymentRate: formData.paymentRate,
        paymentType: formData.paymentType as "fixed" | "cpm",
        categories: formData.categories, // Send as array
        languages: formData.languages, // Send as array
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        gKeyCooloffHours: convertToHours(formData.gKeyCooloffValue, formData.gKeyCooloffUnit),
        mediaFile: formData.mediaFile,
      };
      await onSubmit(backendData);
    } catch (error) {
      console.error("Error submitting campaign:", error);
      setErrors({
        ...errors,
        form: "An error occurred while saving the campaign. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message if form submission fails */}
      {errors.form && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{errors.form}</p>
          </div>
        </div>
      )}

      {/* Campaign Info Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Campaign Information</h2>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Campaign Title
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Campaign Media</h2>
        <div className="border-2 border-dashed rounded-md p-4">
          {mediaPreview ? (
            <div className="relative">
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                {formData.mediaType === MediaType.IMAGE ? (
                  <Image
                    src={mediaPreview}
                    alt="Media preview"
                    fill
                    objectFit="cover"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={clearMediaPreview}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4 flex flex-col items-center">
                <label
                  htmlFor="media-upload"
                  className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Upload className="h-4 w-4 mr-2 inline" />
                  Upload Media
                </label>
                <input
                  id="media-upload"
                  name="media"
                  type="file"
                  accept="image/*,video/*"
                  className="sr-only"
                  onChange={handleMediaChange}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB, or MP4, WEBM up to 50MB
                </p>
              </div>
            </div>
          )}
          {errors.mediaUrl && (
            <p className="text-red-500 text-xs mt-1">{errors.mediaUrl}</p>
          )}
        </div>
      </div>

      {/* Budget and Payment Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Budget & Payment</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="budget"
              className="block text-sm font-medium text-gray-700"
            >
              Total Budget ({getCurrencyCode()})
            </label>
            <Input
              id="budget"
              name="budget"
              type="number"
              min="1"
              step="1"
              value={formData.budget}
              onChange={handleChange}
              className={errors.budget ? "border-red-500" : ""}
            />
            {errors.budget && (
              <p className="text-red-500 text-xs mt-1">{errors.budget}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="paymentRate"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Rate
            </label>
            <div className="flex">
              <Input
                id="paymentRate"
                name="paymentRate"
                type="number"
                min="1"
                step="0.01"
                value={formData.paymentRate}
                onChange={handleChange}
                className={`flex-grow ${errors.paymentRate ? "border-red-500" : ""}`}
              />
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                className="ml-2 rounded-md border border-input px-3 py-2 bg-background"
              >
                <option value="cpm">CPM (per 1k views)</option>
                <option value="fixed">Fixed (per stream)</option>
              </select>
            </div>
            {errors.paymentRate && (
              <p className="text-red-500 text-xs mt-1">{errors.paymentRate}</p>
            )}
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-md flex">
          <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            {formData.paymentType === "cpm"
              ? `With a CPM rate of ${formatCurrency(formData.paymentRate)}, streamers will earn ${formatCurrency(formData.paymentRate)} per 1,000 views.`
              : `With a fixed rate of ${formatCurrency(formData.paymentRate)}, streamers will earn ${formatCurrency(formData.paymentRate)} per stream regardless of viewership.`}
            Your total budget of {formatCurrency(formData.budget)} will
            {formData.paymentType === "cpm"
              ? ` support approximately ${Math.floor((formData.budget / formData.paymentRate) * 1000).toLocaleString()} views.`
              : ` support approximately ${Math.floor(formData.budget / formData.paymentRate).toLocaleString()} streams.`}
          </p>
        </div>
      </div>

      {/* Targeting Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Targeting</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category (Select One)
            {errors.categories && (
              <span className="text-red-500 text-xs ml-2">{errors.categories}</span>
            )}
          </label>
          
          {/* Selected Category Tag */}
          {formData.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => removeCategoryTag()}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Popular Categories Quick Select */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Popular Categories:</p>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    formData.categories.includes(category)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for a category..."
                value={categorySearch}
                onChange={handleCategorySearchChange}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => {
                  // Delay hiding to allow clicks on dropdown items
                  setTimeout(() => setShowCategoryDropdown(false), 200);
                }}
                className="pl-10"
              />
            </div>

            {/* Dropdown */}
            {showCategoryDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryFromDropdown(category)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between text-gray-900 ${
                        formData.categories.includes(category) ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span className="text-sm">{category}</span>
                      {formData.categories.includes(category) && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No categories found
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Select one category that best describes your campaign. You can change your selection by clicking on a different category.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Languages
            {errors.languages && (
              <span className="text-red-500 text-xs ml-2">{errors.languages}</span>
            )}
          </label>
          
          {/* Selected Languages Tags */}
          {formData.languages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.languages.map((language) => (
                <span
                  key={language}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {language}
                  <button
                    type="button"
                    onClick={() => removeLanguageTag(language)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Popular Languages Quick Select */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Popular Languages:</p>
            <div className="flex flex-wrap gap-2">
              {popularLanguages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => handleLanguageSelect(language)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    formData.languages.includes(language)
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search languages..."
                value={languageSearch}
                onChange={handleLanguageSearchChange}
                onFocus={() => setShowLanguageDropdown(true)}
                onBlur={() => {
                  // Delay hiding to allow clicks on dropdown items
                  setTimeout(() => setShowLanguageDropdown(false), 200);
                }}
                className="pl-10"
              />
            </div>

            {/* Dropdown */}
            {showLanguageDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageFromDropdown(language)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between text-gray-900 ${
                        formData.languages.includes(language) ? 'bg-green-50 text-green-700' : ''
                      }`}
                    >
                      <span className="text-sm">{language}</span>
                      {formData.languages.includes(language) && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No languages found
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Use popular languages above or search for specific ones. You can select multiple languages.
          </p>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Schedule (Optional)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate}
            />
          </div>
        </div>
      </div>

      {/* G-Key Settings Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          G-Key Cooloff Period
        </h2>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            How long should streamers wait before using another G-Key for this category after completing your campaign?
          </label>
          
          <div className="flex gap-3 max-w-sm">
            <div className="flex-1">
              <Input
                type="number"
                name="gKeyCooloffValue"
                value={formData.gKeyCooloffValue || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    gKeyCooloffValue: value === "" ? 0 : parseInt(value) || 0
                  });
                }}
                min="1"
                className="w-full"
                placeholder="Enter number"
              />
              {errors.gKeyCooloff && (
                <p className="text-red-500 text-xs mt-1">{errors.gKeyCooloff}</p>
              )}
            </div>
            
            <div className="w-32">
              <Select
                value={formData.gKeyCooloffUnit}
                onValueChange={(value: "hours" | "days" | "months" | "years") =>
                  setFormData({
                    ...formData,
                    gKeyCooloffUnit: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-md flex">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">About G-Key Cooloff Periods & Same Brand Benefits:</p>
              <p className="mb-2">
                G-Keys prevent streamers from promoting multiple competing campaigns simultaneously. 
                The cooloff period you choose determines how long streamers must wait before they can 
                use another G-Key in the same category ({formData.categories.length > 0 ? formData.categories[0] : 'selected category'}) 
                after completing your campaign. Selected period: <strong>
                  {formData.gKeyCooloffValue > 0 ? `${formData.gKeyCooloffValue} ${formData.gKeyCooloffUnit}` : 'Not set'}
                </strong>
              </p>
              <p className="text-green-700 bg-green-50 p-2 rounded border-l-2 border-green-300">
                <strong>Same Brand Advantage:</strong> Streamers who complete campaigns from your brand can join 
                new campaigns from your brand in the same category immediately, without waiting for the cooloff period. 
                When they complete multiple campaigns from your brand, they&apos;ll serve the highest cooloff period among all your campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Status */}
      {isEditing && (
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Campaign Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-md border border-input px-3 py-2 bg-background"
          >
            {Object.values(CampaignStatus).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Campaign"
            : "Create Campaign"}
        </Button>
      </div>
    </form>
  );
}