---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

<H2>Journals</H2>
1. **S. M. A. Huda** and S. Moh, “Survey on Computation Offloading in UAV-Enabled Mobile Edge Computing,” Journal of Network and Computer Applications, Vol. 201, pp. 1-26, doi: 10.1016/j.jnca.2022.103341, May 2022. (published by Elsevier, Netherlands, IF: 6.281 (6/108, 5.56%), ISSN 1084-8045) 

<H2>Conference papers</H2>
1. **S. M. A. Huda**, I. J. Ila, S. Sarder, M. Shamsujjoha and M. N. Y. Ali, "An Improved Approach for Detection of Diabetic Retinopathy Using Feature Importance and Machine Learning Algorithms," 2019 7th International Conference on Smart Computing & Communications (ICSCC), 2019, pp. 1-5, doi: 10.1109/ICSCC.2019.8843676.
2. **S. M. A. Huda**, M. M. Shoikot, M. A. Hossain and I. J. Ila, "An Effective Machine Learning Approach for Sentiment Analysis on Popular Restaurant Reviews in Bangladesh," 2019 1st International Conference on Artificial Intelligence and Data Sciences (AiDAS), 2019, pp. 170-173, doi: 10.1109/AiDAS47888.2019.8970976.
3. Abdullah-All-Tanvir, E. M. Mahir, **S. M. A. Huda** and S. Barua, "A Hybrid Approach for Identifying Authentic News Using Deep Learning Methods on Popular Twitter Threads," 2020 International Conference on Artificial Intelligence and Signal Processing (AISP), 2020, pp. 1-6, doi: 10.1109/AISP48273.2020.9073583.

{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
