import axios from "axios";

import React, { use, useState } from "react";

const CourseContents = (param) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <div>
      {/* title, tags, descriptions, etc (little details) ///////// -> divider & extracted text //////////// go back button */}
    </div>
  );
};

export default CourseContents;
