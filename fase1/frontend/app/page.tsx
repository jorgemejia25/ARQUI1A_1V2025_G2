import { subtitle, title } from "@/components/primitives";

import { Code } from "@heroui/code";
import { GithubIcon } from "@/components/icons";
import { Leaf } from "lucide-react";
import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { button as buttonStyles } from "@heroui/theme";
import { siteConfig } from "@/lib/config/site";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Leaf className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className={title({ size: "lg" })}>SIEPA</span>
        </div>
        <span className={title()}>Sistema Inteligente de&nbsp;</span>
        <span className={title({ color: "violet" })}>
          Evaluación y Predicción&nbsp;
        </span>
        <br />
        <span className={title()}>Ambiental</span>
        <div className={subtitle({ class: "mt-4" })}>
          Monitoreo en tiempo real de condiciones ambientales y consumo
          energético.
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href="/dashboard"
        >
          Abrir Dashboard
        </Link>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            Panel de control disponible en{" "}
            <Code color="primary">/dashboard</Code>
          </span>
        </Snippet>
      </div>
    </section>
  );
}
