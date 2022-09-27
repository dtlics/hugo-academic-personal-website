---
# An instance of the Contact widget.
widget: contact

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 130

title: Contact
subtitle:

content:
  # Automatically link email and phone or display as text?
  autolink: true

  # Email form provider
  form:
    provider: netlify
    formspree:
      id:
    netlify:
      # Enable CAPTCHA challenge to reduce spam?
      captcha: false

  # Contact details (edit or remove options as required)
  email: dtlics2000@gmail.com
  phone: +14753014348
  address:
    street: 420 Temple Street
    city: New Haven
    region: CT
    postcode: '06511'
    country: United States
    country_code: US
  coordinates:
    latitude: '41.3124'
    longitude: '72.9229'
#   office_hours:
#     - 'Monday 10:00 to 13:00'
#     - 'Wednesday 09:00 to 10:00'
  appointment_url: 'https://calendly.com/dtlics2000'
#   contact_links:
#     - icon: twitter
#       icon_pack: fab
#       name: DM Me
#       link: 'https://twitter.com/Twitter'
#     - icon: video
#       icon_pack: fas
#       name: Zoom Me
#       link: 'https://zoom.com'

design:
  columns: '2'
---
