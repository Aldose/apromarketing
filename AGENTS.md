# Purpose 
this project is for creating a marketing website for a-pro ai. The main purpose is to host a form on the top of each page that has a form to be filled out and then the form's content is sent to another api endpoit and then retrieve and display the contents of it's response. That form will be on the top of every page while the rest of the page will contain the UI for a blog website, including search features, and displaying blog content

## CMS 
For now we'll be self hosting ghost for our CMS and for handling the blog content, see: https://ghost.org/resources/
and we'll use code injection to render the form and handle displaying the content from that endpoints detailed in the next section

## demo endpoint
the code for the existing demo endpoint handling is in the directory called server. Feel free to modify the contents to adapt to running alongside ghost but note the api endpoints should only be accessible via the form within the ghost website. The main aim should be to have a user be able to put in their website in the form, and while the api is handling the request the user should still be able to read the articles. 


## Integration of demo and ghost
I will be sending in a set of screenshots with instructions colored in red for how I want the animations on the demo site to go after a user submits a website in the demo form. I'll be updating this document with percise instructions on how the UI will change with each step. 

phase 1: 
examine the png file called Phase1UIanimations.png. When a user submits a website and clicks the submit button. the graphic to the left of the form will fade away as instructed and the form with the loading animation will move to the left to occupy the same space the graphic used to be with labeled sections fading out per instructions in the screenshot. 

phase 2:
look at Phase2UIanimations.png while the demo is processing on the left a window with titles and excerpts of blogs from the ghost website will float in from the right. 

phase 3:
examine the instructions in Phase3UIAnimations.png when a user clicks on one of the blogs. The selected article will expand to take up most of the space of the div with the id "blog panel" with 2% padding surround the article view. There should be a button to close the article on the upper right to return the div back to it's original state for the user to select another article. 

bug fix: change the not working scrolling behavior for paginating the blogs with a simple < > interface that will go forward and backwards in pagination. 

## Animation fixes
use percentages of screen width to do the transitions
- when form is submitted leftmost graphic "div with the id='hero-graphic'" transitions to 0% 
- demo form input "div with id='demo-form-section'" goes from 50% to 100% and then back to 50% once it moves across the screen. 
- as the demo form moves across the screen the blog container will slowly come in from the right till it takes up 50% of the width. 

# Rules to follow
- Use Bun instead of node
- obey any AI-NOTES comments 
- be calm and deliberate, check back with the user when tasks seem unclear
- if you hit roadblocks that conflict with the contents of this file, proactively reach out to the human developer with the issue and seek guidance. 
- utilize vue and nuxt: https://nuxt.com/docs/4.x/getting-started/introduction for front end animations and interactions
- do not use mocks unless explicitely told to do so, use real data and announce when you are unable to and check in with human developer
- never add api keys or other private information to the scripts themselves they must always be read from the environmental variables. 
