"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please upload an image file");
      setSubmitStatus("error");
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Screenshot must be less than 5MB");
      setSubmitStatus("error");
      return;
    }
    
    setScreenshot(file);
    setErrorMessage("");
    setSubmitStatus("idle");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !message) {
      setErrorMessage("Please fill in all required fields");
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("message", message);
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitStatus("success");
      // Clear form
      setEmail("");
      setMessage("");
      setScreenshot(null);
      // Reset file input
      const fileInput = document.getElementById("screenshot") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message. Please try again.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Contact Epigram</h1>
          <p className="text-lg text-gray-600">
            Ask questions, make suggestions, or report a bug.
          </p>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                What is your email? <span className="text-black">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Message <span className="text-black">*</span>
              </label>
              <Textarea
                id="message"
                placeholder="Tell us what's on your mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={isSubmitting}
                className="min-h-[150px] w-full resize-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="screenshot" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Attach a screenshot <span className="text-gray-500">(optional)</span>
              </label>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
                <label 
                  htmlFor="screenshot" 
                  className={cn(
                    "flex flex-col items-center",
                    !isSubmitting && "cursor-pointer"
                  )}
                >
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-600">
                    {screenshot ? `Selected: ${screenshot.name}` : "Click to choose a file or drag here"}
                  </span>
                </label>
              </div>
            </div>

            {/* Status Messages */}
            {submitStatus === "success" && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span>Message sent successfully! We&apos;ll get back to you soon.</span>
              </div>
            )}

            {submitStatus === "error" && errorMessage && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !email || !message}
              className={cn(
                "w-full cursor-pointer",
                isSubmitting && "cursor-not-allowed opacity-70"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}