"use client";

import React from "react";

export default function PowerBIPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        Flipkart Power BI Dashboard
      </h1>

      <div className="w-full max-w-5xl aspect-video border rounded-xl overflow-hidden shadow-md">
        <iframe
          title="Flipkart_PowerBI_Dashboard"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/reportEmbed?reportId=98fdc7dd-69a3-4a9e-ad41-115f6172b52e&autoAuth=true&ctid=1ad0b98d-dfa7-436f-bce3-195d1ca221fe"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
