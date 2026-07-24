---
title: "Code"
layout: textlay
sitemap: true
permalink: /code/
---

# Code
<div class="julia-logo-block" markdown="0">
<a class="julia-logo-link" href="https://julialang.org/" aria-label="Julia programming language website">
  <img class="julia-logo" src="{{ '/assets/images/logos/julia-logo.svg' | relative_url }}" alt="Julia">
</a>
</div>

Julia is well suited to computational Physics, and our group has been using Julia for research since 2016 (Julia v0.4). The language has been mature and stable since 2018 when v1.0 was released, and has a capable and diverse package ecosystem.

Our aim is to support the research community by developing high quality Julia packages.

Julia repositories from the group, currently drawn from the pinned repositories on
[Ashton Bradley's GitHub profile](https://github.com/AshtonSBradley).

<style>
  #textid h1:first-child {
    margin-top: 32px;
  }

  .julia-logo-block {
    clear: both;
    margin: 10px auto 26px;
    text-align: center;
  }

  .julia-logo-link {
    display: inline-block;
    width: fit-content;
    transition: opacity 0.2s ease-in-out;
  }

  .julia-logo-link:hover,
  .julia-logo-link:focus {
    opacity: 0.82;
  }

  .julia-logo {
    display: block;
    width: 220px;
    max-width: 70vw;
    height: auto;
    margin: 0;
  }

  .code-repos {
    display: grid;
    grid-template-columns: 1fr;
    gap: 22px;
    margin: 28px auto 60px;
    max-width: 980px;
  }

  @media (min-width: 760px) {
    .code-repos {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .code-repo {
    background: var(--well-bg);
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .code-repo-image-link {
    display: block;
    width: 100%;
    background: white;
    cursor: pointer;
    transition: opacity 0.2s ease-in-out;
  }

  .code-repo-image-link:hover,
  .code-repo-image-link:focus {
    opacity: 0.86;
  }

  .code-repo-image {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 220px;
    object-fit: contain;
    margin: 0;
    padding: 14px;
    border-radius: 0;
    box-sizing: border-box;
  }

  .code-repo-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 18px 20px 20px;
  }

  .code-repo h2 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 2.2rem;
  }

  .code-repo p {
    flex: 1;
    margin-bottom: 16px;
  }
</style>

<section class="code-repos" markdown="0">
{% for repo in site.data.code %}
<article class="code-repo">
{% if repo.image %}
<a href="{{ repo.url }}" class="code-repo-image-link">
<img class="code-repo-image" src="../assets/images/code/{{ repo.image }}" alt="{{ repo.image_alt | default: repo.name }}">
</a>
{% endif %}
<div class="code-repo-body">
<h2><a href="{{ repo.url }}">{{ repo.name }}</a></h2>
<p>{{ repo.description }}</p>
<div class="code-repo-meta">
<span>{{ repo.language }}</span>
<span>{{ repo.stars }} star{% unless repo.stars == 1 %}s{% endunless %}</span>
<span>{{ repo.forks }} fork{% unless repo.forks == 1 %}s{% endunless %}</span>
</div>
</div>
</article>
{% endfor %}
</section>
