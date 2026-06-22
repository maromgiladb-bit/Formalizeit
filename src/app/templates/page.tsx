"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

interface Template {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  tags: string[];
  previewImage?: string;
}

export default function TemplateSelectionPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // Check for mode=html
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    // Always redirect to fillndahtml
    router.push(`/fillndahtml?templateId=${templateId}&new=true`);
  };

  const categories = ["all", ...new Set(templates.map(t => t.category))];
  const filteredTemplates = selectedCategory === "all"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Step 1 of 2</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink mb-4">
            Choose Your NDA Template {mode === "html" && <span className="text-teal-700">(HTML Editor)</span>}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Select the template that best fits your needs. Each template is professionally designed and legally sound.
            {mode === "html" && <span className="block mt-2 text-teal-700 font-medium">You&apos;ll be redirected to the HTML-based editor with live preview.</span>}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer ${selectedCategory === category
                  ? "bg-teal-800 text-white shadow-card"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && (
          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white rounded-2xl shadow-card hover:shadow-float transition-shadow duration-300 overflow-hidden group cursor-pointer border border-gray-100 w-full md:w-[calc(50%-2rem)] lg:w-[380px] flex flex-col"
                onClick={() => handleSelectTemplate(template.id)}
              >
                {/* Preview Image or Placeholder */}
                <div className="h-48 bg-gray-50 relative overflow-hidden shrink-0">
                  {template.previewImage ? (
                    <Image
                      src={template.previewImage}
                      alt={template.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full">
                      v{template.version}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-ink group-hover:text-teal-800 transition-colors">
                      {template.name}
                    </h3>
                  </div>

                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template.id);
                    }}
                    className="w-full mt-auto"
                  >
                    <span>Use This Template</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Placeholder for future templates */}
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center w-full md:w-[calc(50%-2rem)] lg:w-[380px]">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-500 mb-2">More Templates Coming Soon</h3>
              <p className="text-gray-400 text-sm">We are working hard to bring you more legally sound templates.</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-ink mb-2">No templates found</h3>
            <p className="text-gray-600">Try selecting a different category</p>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="px-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
