import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Certaines signatures sont imposées de l'extérieur : une action passée à
      // useActionState reçoit toujours (état, formData), même quand elle n'a
      // besoin ni de l'un ni de l'autre. Le préfixe _ dit que c'est voulu.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // src/components/ui contient les composants installés tels quels depuis les
    // registres (shadcn, Magic UI) : on ne les modifie pas à la main, sinon la
    // prochaine réinstallation efface la retouche. Leurs écarts de style ne
    // doivent donc pas faire échouer le lint de notre propre code.
    //
    // - no-img-element : leurs cadres d'appareils affichent la capture avec un
    //   <img>, volontairement, parce qu'ils ignorent tout de next/image.
    // - set-state-in-effect : règle apparue après l'installation de carousel et
    //   use-mobile, qui suivent encore l'ancien usage.
    files: ["src/components/ui/**"],
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
