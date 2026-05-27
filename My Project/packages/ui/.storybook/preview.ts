import type { Preview } from "@storybook/react";

import "../src/tokens/colors.css";
import "../src/tokens/typography.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "oklch(9% 0.010 260)" },
        { name: "light", value: "oklch(97% 0.005 260)" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      defaultValue: "dark",
      toolbar: {
        icon: "circlehollow",
        items: ["dark", "light"],
        showName: true,
      },
    },
  },
};

export default preview;
