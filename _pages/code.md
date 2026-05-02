---
title: "Code"
layout: textlay
sitemap: true
permalink: /code/
---

# Code

Julia repositories from the group, currently drawn from the pinned repositories on
[Ashton Bradley's GitHub profile](https://github.com/AshtonSBradley).

<section class="code-repos">
{% for repo in site.data.code %}
<article class="code-repo">
<h2><a href="{{ repo.url }}">{{ repo.name }}</a></h2>
<p>{{ repo.description }}</p>
<div class="code-repo-meta">
<span>{{ repo.language }}</span>
<span>{{ repo.stars }} star{% unless repo.stars == 1 %}s{% endunless %}</span>
<span>{{ repo.forks }} fork{% unless repo.forks == 1 %}s{% endunless %}</span>
</div>
</article>
{% endfor %}
</section>
