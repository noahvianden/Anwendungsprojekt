<template>
    <div class="right-sidebar">
      <div class="top-box">
        Eigener Inhalt
      </div>
      <div class="bottom-box">
        Google Maps Inhalt
      </div>
    </div>
  </template>
  
  <script>
  export default {};
  </script>
  
  <style scoped>
  .right-sidebar {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid black;
  }
  
  .top-box,
  .bottom-box {
    flex: 1;
    border: 1px solid black;
    margin: 10px;
  }
  </style>
  