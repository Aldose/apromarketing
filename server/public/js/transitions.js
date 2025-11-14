
// if (!document.startViewTransition) {
//   console.log("View Transitions API is not supported in this browser.");
// }
// document.addEventListener("DOMContentLoaded", () => {
//   console.log('DOMContentLoaded')
//   document.body.addEventListener("click", (event) => {
//     console.log('click')
//     const link = event.target.closest("a");
//     if (link && link.origin === location.origin) {
//       console.log('click origin')
//       event.preventDefault(); // Stop default navigation

//       // Start transition
//       document.startViewTransition(() => {
//         console.log('click startViewTransition', window.location.href, link.href)
//         window.location.href = link.href;
//       });
//     }
//   });
// });