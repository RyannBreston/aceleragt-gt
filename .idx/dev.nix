# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use. Switched to a recent stable version.
  channel = "nixos-24.05";

  # Use https://search.nixos.org/packages to find packages.
  # NodeJS version now matches the project's `package.json`.
  # Removed unused Java package.
  packages = [
    pkgs.nodejs_22
  ];

  # Sets environment variables in the workspace
  env = {};

  # This adds a file watcher to startup the firebase emulators.
  # The projectId now matches your project's ID.
  services.firebase.emulators = {
    detect = true;
    projectId = "SuperModa"; # Updated Project ID
    services = ["auth" "firestore"];
  };

  idx = {
    # Recommended extensions for a Next.js, TypeScript, and TailwindCSS project.
    # Use https://open-vsx.org/ to find more extensions.
    extensions = [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "bradlc.vscode-tailwindcss"
    ];

    workspace = {
      # Defines files to be opened when the workspace is created.
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx",
          "README.md" # Good practice to also open the README
        ];
      };
    };

    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm", "run", "dev", "--", "--port", "$PORT", "--hostname", "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
