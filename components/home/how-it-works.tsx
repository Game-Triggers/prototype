"use client";

export function HowItWorks() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">How It Works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-4">
          <div className="font-bold text-4xl text-primary mb-2">1</div>
          <h3 className="font-bold text-xl">Create or Join</h3>
          <p className="text-muted-foreground">Brands create campaigns, streamers join them.</p>
        </div>
        <div className="p-4">
          <div className="font-bold text-4xl text-primary mb-2">2</div>
          <h3 className="font-bold text-xl">Set Up Overlays</h3>
          <p className="text-muted-foreground">Add the browser source to your streaming software.</p>
        </div>
        <div className="p-4">
          <div className="font-bold text-4xl text-primary mb-2">3</div>
          <h3 className="font-bold text-xl">Earn & Analyze</h3>
          <p className="text-muted-foreground">Track performance and receive payments.</p>
        </div>
      </div>
    </div>
  );
}
