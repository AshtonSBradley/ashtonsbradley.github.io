---
title: "Theses of the group"
layout: default
sitemap: false
permalink: /theses
---


## PhD theses

<!-- #### Full list of theses of the group -->

<ul>
  {% for thesis in site.data.theses.PhD_theses %}
  <li><strong>{{ thesis.name }}</strong> ({{ thesis.year }}) : {{ thesis.title }} 
    {% if thesis.link %}
    <a href="{{ thesis.link }}">[PDF]</a>
    {% endif %}
  </li>
  {% endfor %}
</ul>

## Master/Hons theses

{% for year_group in site.data.theses.internships %}
#### {{ year_group.year }}

<ul>
  {% for thesis in year_group.theses %}
  <li><strong>{{ thesis.name }}</strong> : {{ thesis.title }} 
    {% if thesis.link %}
    <a href="{{ thesis.link }}">[PDF]</a>
    {% endif %}
  </li>
  {% endfor %}
</ul>
{% endfor %}
<p class="pb-10">  </p>

<style>
  .pb-10 {
    padding-bottom: 1.5em;
  }
  </style>

