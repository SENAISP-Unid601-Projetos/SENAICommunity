import React from 'react';

const InputField = ({ icon, ...props }) => (
    <div className="input-group">
        <i className={icon}></i>
        <input {...props} />
    </div>
);

export default InputField;