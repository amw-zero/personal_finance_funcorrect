import { expect } from 'chai';
import { describe } from 'mocha';
// if you used the '@types/mocha' method to install mocha type definitions, uncomment the following line
// import 'mocha';

describe('Hello function', () => {
  it('should return hello world', () => {
    expect("hi").to.equal('Hello World!');
  });
});