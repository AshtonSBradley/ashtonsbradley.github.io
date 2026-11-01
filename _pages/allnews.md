---
title: "News"
excerpt: "QF Group @ Otago"
layout: textlay
sitemap: false
permalink: /allnews/
---

# All News

{% assign sorted_articles = site.news | sort: 'date' | reverse %}
<ul class="no-bullet news-archive-list">
{% for article in sorted_articles%}
    <li class="news-archive-item">
        <a class="news-archive-image-space" href="{{ article.url | relative_url }}">
            <img class="news-archive-image" src="{{ '/assets/images/news/' | append: article.image | relative_url }}" alt="{{ article.image_alt | default: article.title | escape }}">
        </a>
        <div class="news-archive-content">
            <time class="news-archive-date" datetime="{{ article.date | date_to_xmlschema }}">{{ article.date | date: "%B %d, %Y" }}</time>
            <h2 class="news-archive-title">{{ article.title }}</h2>
            <p class="news-archive-excerpt" lang="en">
                {{ article.content | strip_html | truncatewords: 40 }}
            </p>

            <a class="btn-home news-archive-more" href="{{ article.url | relative_url }}">
                <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
                Read more
            </a>
        </div>
    </li>
{% endfor %}
</ul>
<script src="{{ '/js/news.js' | relative_url }}" defer></script>

    
{% for article in site.data.news %}
{{ article.date }} - {{ article.headline }}
{% endfor %}
