# srplife_theme

A Hugo theme for my blog at [srp.life](https://srp.life). You can find the content repo [here](https://github.com/RdrSeraphim/blog).

The old CDE theme can be found in the `cde` branch. The old Ghost theme can be found in the `ghost` branch. The even older Ghost theme can be found in the `prometheus` branch.

## Usage

In your Hugo repo, run `hugo mod add github.com/RdrSeraphim/srplife_theme/v4`, then in your `hugo.toml` file, set `theme = "github.com/RdrSeraphim/srplife_theme/v4"`.

If an update is available, run `hugo mod get -u && hugo mod tidy`.

## Local Preview

`npm run dev` will build the theme using the `exampleSite` folder for content. You can open `http://localhost:8787` in your browser to see the theme in action.