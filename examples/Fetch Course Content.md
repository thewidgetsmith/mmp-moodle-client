# Interchange to search for and locate course content

## Fetch Courses by Category

Request:

```sh
curl -X GET 'https://lms.mapmypath.co/webservice/rest/server.php?moodlewsrestformat=json&wsfunction=core_course_get_courses_by_field&field=category&value=8&wstoken=token_token_token' \
  --header 'User-Agent: yaak' \
  --header 'Accept: application/json'
```

Response:

```json
{
  "courses": [
    {
      "id": 11,
      "fullname": "Julia's Path To Employment",
      "displayname": "Julia's Path To Employment",
      "shortname": "Julias Path To Employment",
      "courseimage": "https://lms.mapmypath.co/pluginfile.php/60/course/generated/course.svg",
      "categoryid": 8,
      "categoryname": "Work and Careers",
      "sortorder": 60002,
      "summary": "<p>Short Course Summary</p>",
      "summaryformat": 1,
      "summaryfiles": [],
      "overviewfiles": [],
      "showactivitydates": true,
      "showcompletionconditions": true,
      "contacts": [
        {
          "id": 3,
          "fullname": "Richard Macdonald"
        }
      ],
      "enrollmentmethods": [
        "manual"
      ],
      "customfields": [
        {
          "name": "Course Content Type",
          "shortname": "content_type",
          "type": "select",
          "valueraw": 3,
          "value": "Video"
        },
        {
          "name": "Course Content Duration",
          "shortname": "content_duration",
          "type": "text",
          "valueraw": "3 min",
          "value": "3 min"
        }
      ],
      "idnumber": "",
      "format": "topics",
      "showgrades": 1,
      "newsitems": 5,
      "startdate": 1784181600,
      "enddate": 0,
      "maxbytes": 0,
      "showreports": 0,
      "visible": 1,
      "groupmode": 0,
      "groupmodeforce": 0,
      "defaultgroupingid": 0,
      "enablecompletion": 1,
      "completionnotify": 0,
      "lang": "",
      "theme": "",
      "marker": 0,
      "legacyfiles": 0,
      "calendartype": "",
      "timecreated": 1784156632,
      "timemodified": 1784162619,
      "requested": 0,
      "cacherev": 1784162621,
      "filters": [
        {
          "filter": "displayh5p",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "activitynames",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "mathjaxloader",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "emoticon",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "urltolink",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "mediaplugin",
          "localstate": 0,
          "inheritedstate": 1
        }
      ],
      "courseformatoptions": [
        {
          "name": "hiddensections",
          "value": 1
        },
        {
          "name": "coursedisplay",
          "value": 0
        },
        {
          "name": "indentation",
          "value": "1"
        }
      ]
    },
    {
      "id": 12,
      "fullname": "Jackson's Employment Journey",
      "displayname": "Jackson's Employment Journey",
      "shortname": "Jacksons Employment Journey",
      "courseimage": "https://lms.mapmypath.co/pluginfile.php/64/course/generated/course.svg",
      "categoryid": 8,
      "categoryname": "Work and Careers",
      "sortorder": 60001,
      "summary": "<p>Short course summary</p>",
      "summaryformat": 1,
      "summaryfiles": [],
      "overviewfiles": [],
      "showactivitydates": true,
      "showcompletionconditions": true,
      "contacts": [
        {
          "id": 3,
          "fullname": "Richard Macdonald"
        }
      ],
      "enrollmentmethods": [
        "manual"
      ],
      "customfields": [
        {
          "name": "Course Content Type",
          "shortname": "content_type",
          "type": "select",
          "valueraw": 3,
          "value": "Video"
        },
        {
          "name": "Course Content Duration",
          "shortname": "content_duration",
          "type": "text",
          "valueraw": "2 min",
          "value": "2 min"
        }
      ],
      "idnumber": "",
      "format": "topics",
      "showgrades": 1,
      "newsitems": 5,
      "startdate": 1784181600,
      "enddate": 0,
      "maxbytes": 0,
      "showreports": 0,
      "visible": 1,
      "groupmode": 0,
      "groupmodeforce": 0,
      "defaultgroupingid": 0,
      "enablecompletion": 1,
      "completionnotify": 0,
      "lang": "",
      "theme": "",
      "marker": 0,
      "legacyfiles": 0,
      "calendartype": "",
      "timecreated": 1784162837,
      "timemodified": 1784162837,
      "requested": 0,
      "cacherev": 1784162907,
      "filters": [
        {
          "filter": "displayh5p",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "activitynames",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "mathjaxloader",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "emoticon",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "urltolink",
          "localstate": 0,
          "inheritedstate": 1
        },
        {
          "filter": "mediaplugin",
          "localstate": 0,
          "inheritedstate": 1
        }
      ],
      "courseformatoptions": [
        {
          "name": "hiddensections",
          "value": 1
        },
        {
          "name": "coursedisplay",
          "value": 0
        },
        {
          "name": "indentation",
          "value": "1"
        }
      ]
    }
  ],
  "warnings": []
}
```

## Fetch Course Content by ID

Request:

```sh
curl -X GET 'https://lms.mapmypath.co/webservice/rest/server.php?moodlewsrestformat=json&wsfunction=core_course_get_contents&courseid=11&wstoken=token_token_token' \
  --header 'User-Agent: yaak' \
  --header 'Accept: application/json'
```

Response:

```json
[
  {
    "id": 52,
    "name": "General",
    "visible": 1,
    "summary": "",
    "summaryformat": 1,
    "section": 0,
    "hiddenbynumsections": 0,
    "uservisible": true,
    "component": null,
    "itemid": null,
    "modules": [
      {
        "id": 20,
        "url": "https://lms.mapmypath.co/mod/url/view.php?id=20",
        "name": "Video",
        "instance": 1,
        "contextid": 62,
        "visible": 1,
        "uservisible": true,
        "visibleoncoursepage": 1,
        "modicon": "https://lms.mapmypath.co/theme/image.php/boost/url/1782767868/monologo?filtericon=1",
        "modname": "url",
        "purpose": "content",
        "branded": false,
        "modplural": "URLs",
        "availability": null,
        "indent": 0,
        "onclick": "",
        "afterlink": null,
        "customdata": "{\"display\":4,\"filtericon\":true}",
        "noviewlink": false,
        "candisplay": true,
        "completion": 0,
        "downloadcontent": 1,
        "dates": [],
        "groupmode": 0,
        "contents": [
          {
            "type": "url",
            "filename": "Video",
            "filepath": null,
            "filesize": 0,
            "fileurl": "https://vimeo.com/1208215275?share=copy&fl=sv&fe=ci",
            "timecreated": null,
            "timemodified": 1784156776,
            "sortorder": null,
            "userid": null,
            "author": null,
            "license": null
          }
        ],
        "contentsinfo": {
          "filescount": 1,
          "filessize": 0,
          "lastmodified": 1784156776,
          "mimetypes": [],
          "repositorytype": ""
        }
      },
      {
        "id": 21,
        "url": "https://lms.mapmypath.co/mod/url/view.php?id=21",
        "name": "Transcript",
        "instance": 2,
        "contextid": 63,
        "visible": 1,
        "uservisible": true,
        "visibleoncoursepage": 1,
        "modicon": "https://lms.mapmypath.co/theme/image.php/boost/url/1782767868/monologo?filtericon=1",
        "modname": "url",
        "purpose": "content",
        "branded": false,
        "modplural": "URLs",
        "availability": null,
        "indent": 0,
        "onclick": "",
        "afterlink": null,
        "customdata": "{\"display\":4,\"filtericon\":true}",
        "noviewlink": false,
        "candisplay": true,
        "completion": 0,
        "downloadcontent": 1,
        "dates": [],
        "groupmode": 0,
        "contents": [
          {
            "type": "url",
            "filename": "Transcript",
            "filepath": null,
            "filesize": 0,
            "fileurl": "https://example.com/transcript",
            "timecreated": null,
            "timemodified": 1784156892,
            "sortorder": null,
            "userid": null,
            "author": null,
            "license": null
          }
        ],
        "contentsinfo": {
          "filescount": 1,
          "filessize": 0,
          "lastmodified": 1784156892,
          "mimetypes": [],
          "repositorytype": ""
        }
      },
      {
        "id": 22,
        "url": "https://lms.mapmypath.co/mod/forum/view.php?id=22",
        "name": "Announcements",
        "instance": 10,
        "contextid": 67,
        "visible": 1,
        "uservisible": true,
        "visibleoncoursepage": 1,
        "modicon": "https://lms.mapmypath.co/theme/image.php/boost/forum/1782767868/monologo?filtericon=1",
        "modname": "forum",
        "purpose": "collaboration",
        "branded": false,
        "modplural": "Forums",
        "availability": null,
        "indent": 0,
        "onclick": "",
        "afterlink": null,
        "activitybadge": [],
        "customdata": "{\"trackingtype\":\"1\"}",
        "noviewlink": false,
        "candisplay": true,
        "completion": 0,
        "downloadcontent": 1,
        "dates": [],
        "groupmode": 0
      }
    ]
  }
]
```
