import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function CatalogHero({ role, onViewRequests }) {
  return (
    <section className="catalog-hero" aria-labelledby="hero-title">
      <div className="catalog-hero__copy">
        <p className="catalog-hero__label">Your learning workspace</p>
        <h1 id="hero-title">
          Your next skill
          <br />
          starts here.
        </h1>
        <p>Explore learning resources. Request access. Keep moving.</p>
        {onViewRequests && (
          <Button size="lg" onClick={onViewRequests}>
            {role === "reviewer" ? "View review queue" : "View my requests"}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
      <img
        className="catalog-hero__art"
        src="/assets/labaccess-hero.png"
        alt=""
        width="1536"
        height="1024"
      />
    </section>
  );
}
