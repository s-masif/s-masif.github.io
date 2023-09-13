---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
---

<H2>Journals</H2>
1. **S. M. A. Huda** and S. Moh, “Deep Reinforcement Learning-Based Computation Offloading in UAV Swarm-Enabled Edge Computing for Surveillance Applications,” IEEE Access, Vol. 11, Issue 1, pp. 68269-68285, doi: 10.1109/ACCESS.2023.3292938, July 6, 2023. (IEEE, USA, IF: 3.9 (100/275, 36.36%), ISSN 2169-3536)
2. A. M. Raivi, **S. M. A. Huda**, M. M. Alam, and S. Moh, “Drone Routing for Drone-Based Delivery Systems: A Review of Trajectory Planning, Charging, and Security,” Sensors, Vol. 23, Issue 3, Article No. 1463, 26 pages (pp. 1-26), doi: 10.3390/s23031463, Jan. 28, 2023. (MDPI, Switzerland, IF: 3.847 (JCR 2021: 19/64, 29.69%), ISSN 1424-8220) 
3. **S. M. A. Huda** and S. Moh, “Survey on Computation Offloading in UAV-Enabled Mobile Edge Computing,” Journal of Network and Computer Applications, Vol. 201, pp. 1-26, doi: 10.1016/j.jnca.2022.103341, May 2022. (published by Elsevier, Netherlands, IF: 6.281 (6/108, 5.56%), ISSN 1084-8045) 
4.  **S. M. A. Huda**, M. Y. Arafat, and S. Moh,, “Wireless Power Transfer in Wirelessly Powered Sensor Networks: A Review of Recent Progress,” Sensors, Vol. 22, Issue 8, Article No. 2952, 34 pages (pp. 1-34), doi: 10.3390/s22082952, Apr. 12, 2022. (published by MDPI, Switzerland, IF: 3.576 (14/64, 21.88%), ISSN 1424-8220) 

<H2>Conference papers</H2>
1. **S. M. A. Huda** and S. Moh, “Transfer Learning Algorithms in Unmanned Aerial Vehicle Networks: A Comprehensive Review,” Proc. of 11th Int. Conf. on Smart Media and Applications (SMA 2022), pp. 9-14, Saipan, USA, Oct. 19-22, 2022. (organized by KISM and KISTI)
2. **S. M. A. Huda**, E. M. Mahir, A. A. Tanvir, and S. Moh, “Evaluation of Machine Learning Models for Detecting Network-Based Intrusions,” Proc. of 10th Int. Conf. on Smart Media and Applications (SMA 2021), pp. 27-31, Gunsan, Korea, Sep. 9-11, 2021. (organized by KISM and ACM)
3. Abdullah-All-Tanvir, E. M. Mahir, **S. M. A. Huda** and S. Barua, "A Hybrid Approach for Identifying Authentic News Using Deep Learning Methods on Popular Twitter Threads," 2020 International Conference on Artificial Intelligence and Signal Processing (AISP), 2020, pp. 1-6, doi: 10.1109/AISP48273.2020.9073583.
4. **S. M. A. Huda**, M. M. Shoikot, M. A. Hossain and I. J. Ila, "An Effective Machine Learning Approach for Sentiment Analysis on Popular Restaurant Reviews in Bangladesh," 2019 1st International Conference on Artificial Intelligence and Data Sciences (AiDAS), 2019, pp. 170-173, doi: 10.1109/AiDAS47888.2019.8970976.
5. **S. M. A. Huda**, I. J. Ila, S. Sarder, M. Shamsujjoha and M. N. Y. Ali, "An Improved Approach for Detection of Diabetic Retinopathy Using Feature Importance and Machine Learning Algorithms," 2019 7th International Conference on Smart Computing & Communications (ICSCC), 2019, pp. 1-5, doi: 10.1109/ICSCC.2019.8843676.



<a href="https://info.flagcounter.com/HbD1"><img src="https://s11.flagcounter.com/count2/HbD1/bg_FFFFFF/txt_000000/border_CCCCCC/columns_2/maxflags_10/viewers_0/labels_0/pageviews_0/flags_0/percent_0/" alt="Flag Counter" border="0"></a>

{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
