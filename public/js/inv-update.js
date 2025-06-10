document.addEventListener("DOMContentLoaded", function () {
  console.log("inv-update.js loaded!");

  const form = document.querySelector("#updateForm");

  if (form) {
    form.addEventListener("change", function () {
      const updateBtn = form.querySelector("button[type='submit']");
      if (updateBtn) {
        console.log("Change detected — enabling button.");
        updateBtn.removeAttribute("disabled");
      }
    });
  }
});


