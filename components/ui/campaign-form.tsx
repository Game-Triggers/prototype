"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CampaignStatus, MediaType } from "@/schemas/campaign.schema";
import { ImageIcon, Upload, X, AlertCircle, Info } from "lucide-react";
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
  "Health",
];

const languagesList = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese",
];

interface CampaignFormData {
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  mediaFile?: File | null;
  budget: number;
  paymentRate: number;
  paymentType: "cpm" | "fixed";
  categories: string[];
  languages: string[];
  startDate: string;
  endDate: string;
  status: CampaignStatus;
}

interface CampaignFormProps {
  initialData?: Partial<CampaignFormData>;
  isEditing?: boolean;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CampaignForm({
  initialData,
  isEditing = false,
  onSubmit,
  isSubmitting,
}: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    mediaUrl: initialData?.mediaUrl || "",
    mediaType: initialData?.mediaType || MediaType.IMAGE,
    mediaFile: null,
    budget: initialData?.budget || (getCurrencyCode() === 'INR' ? 1000 : 10),
    paymentRate: initialData?.paymentRate || (getCurrencyCode() === 'INR' ? 1650 : 20),
    paymentType: initialData?.paymentType || "cpm",
    categories: initialData?.categories || [],
    languages: initialData?.languages || [],
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    status: initialData?.status || CampaignStatus.DRAFT,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaPreview, setMediaPreview] = useState<string | null>(
    initialData?.mediaUrl || null
  );

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

  const handleCategoryToggle = (category: string) => {
    const updatedCategories = formData.categories.includes(category)
      ? formData.categories.filter((cat) => cat !== category)
      : [...formData.categories, category];

    setFormData({
      ...formData,
      categories: updatedCategories,
    });

    // Clear error for this field if it exists
    if (errors.categories) {
      setErrors({
        ...errors,
        categories: "",
      });
    }
  };

  const handleLanguageToggle = (language: string) => {
    const updatedLanguages = formData.languages.includes(language)
      ? formData.languages.filter((lang) => lang !== language)
      : [...formData.languages, language];

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

    if (formData.categories.length === 0) {
      newErrors.categories = "At least one category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
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
            Categories
            {errors.categories && (
              <span className="text-red-500 text-xs ml-2">{errors.categories}</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {categoriesList.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-1 text-sm rounded-full ${
                  formData.categories.includes(category)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Languages (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {languagesList.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => handleLanguageToggle(language)}
                className={`px-3 py-1 text-sm rounded-full ${
                  formData.languages.includes(language)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {language}
              </button>
            ))}
          </div>
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