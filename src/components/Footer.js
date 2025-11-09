import React from "react";
import "./Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="main-footer">
      {`Copyright © Michael Kumsa ${year}`}
    </footer>
  );
};

export default Footer;
