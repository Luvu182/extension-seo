'use strict';

import React from 'react';
import { logger } from '../../../src/shared/utils/logger.js';

/**
 * Simple PropTypes implementation for runtime type checking
 * Since we're not using the prop-types package
 */

const PropTypeError = (message) => new Error(message);

// Type validators
const typeValidators = {
  string: (props, propName, componentName) => {
    if (props[propName] != null && typeof props[propName] !== 'string') {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected \`string\`.`
      );
    }
  },
  
  number: (props, propName, componentName) => {
    if (props[propName] != null && typeof props[propName] !== 'number') {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected \`number\`.`
      );
    }
  },
  
  bool: (props, propName, componentName) => {
    if (props[propName] != null && typeof props[propName] !== 'boolean') {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected \`boolean\`.`
      );
    }
  },
  
  func: (props, propName, componentName) => {
    if (props[propName] != null && typeof props[propName] !== 'function') {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected \`function\`.`
      );
    }
  },
  
  object: (props, propName, componentName) => {
    if (props[propName] != null && typeof props[propName] !== 'object') {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected \`object\`.`
      );
    }
  },
  
  array: (props, propName, componentName) => {
    if (props[propName] != null && !Array.isArray(props[propName])) {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected \`array\`.`
      );
    }
  },
  
  node: (props, propName, componentName) => {
    const prop = props[propName];
    if (prop != null && typeof prop !== 'string' && typeof prop !== 'number' && !React.isValidElement(prop)) {
      return PropTypeError(
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`, expected a React node.`
      );
    }
  },
  
  element: (props, propName, componentName) => {
    if (props[propName] != null && !React.isValidElement(props[propName])) {
      return PropTypeError(
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`, expected a React element.`
      );
    }
  }
};

// Create required versions
const createChainableTypeChecker = (validate) => {
  const checkType = (isRequired, props, propName, componentName) => {
    if (props[propName] == null) {
      if (isRequired) {
        return PropTypeError(
          `Required prop \`${propName}\` was not specified in \`${componentName}\`.`
        );
      }
      return null;
    }
    return validate(props, propName, componentName);
  };

  const chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);
  
  return chainedCheckType;
};

// Export PropTypes object
export const PropTypes = {
  string: createChainableTypeChecker(typeValidators.string),
  number: createChainableTypeChecker(typeValidators.number),
  bool: createChainableTypeChecker(typeValidators.bool),
  func: createChainableTypeChecker(typeValidators.func),
  object: createChainableTypeChecker(typeValidators.object),
  array: createChainableTypeChecker(typeValidators.array),
  node: createChainableTypeChecker(typeValidators.node),
  element: createChainableTypeChecker(typeValidators.element),
  
  // Special validators
  oneOf: (values) => createChainableTypeChecker((props, propName, componentName) => {
    if (!values.includes(props[propName])) {
      return PropTypeError(
        `Invalid prop \`${propName}\` of value \`${props[propName]}\` supplied to \`${componentName}\`, expected one of ${JSON.stringify(values)}.`
      );
    }
  }),
  
  oneOfType: (types) => createChainableTypeChecker((props, propName, componentName) => {
    for (const type of types) {
      const error = type(props, propName, componentName);
      if (!error) return null;
    }
    return PropTypeError(
      `Invalid prop \`${propName}\` supplied to \`${componentName}\`.`
    );
  }),
  
  arrayOf: (type) => createChainableTypeChecker((props, propName, componentName) => {
    if (!Array.isArray(props[propName])) {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected an array.`
      );
    }
    
    for (let i = 0; i < props[propName].length; i++) {
      const error = type({ [i]: props[propName][i] }, i, componentName);
      if (error) {
        return PropTypeError(
          `Invalid prop \`${propName}[${i}]\` supplied to \`${componentName}\`.`
        );
      }
    }
  }),
  
  shape: (shape) => createChainableTypeChecker((props, propName, componentName) => {
    if (typeof props[propName] !== 'object') {
      return PropTypeError(
        `Invalid prop \`${propName}\` of type \`${typeof props[propName]}\` supplied to \`${componentName}\`, expected an object.`
      );
    }
    
    for (const key in shape) {
      const error = shape[key](props[propName], key, componentName);
      if (error) {
        return PropTypeError(
          `Invalid prop \`${propName}.${key}\` supplied to \`${componentName}\`.`
        );
      }
    }
  })
};

/**
 * Validate props for a component
 * @param {Object} props - Props to validate
 * @param {Object} propTypes - PropTypes definition
 * @param {string} componentName - Component name for error messages
 */
export function validateProps(props, propTypes, componentName) {
  if (!propTypes) return; // Remove process.env check - not available in browser
  
  for (const propName in propTypes) {
    const error = propTypes[propName](props, propName, componentName);
    if (error) {
      logger.error('PropTypes', error.message);
    }
  }
}