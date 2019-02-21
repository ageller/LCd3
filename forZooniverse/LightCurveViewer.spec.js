import * as d3 from 'd3'
import { render } from 'enzyme'
import { zip } from 'lodash'
import React from 'react'

import LightCurveViewer from './LightCurveViewer'

//data file (this eventually needs to look at the subject set)
//but this doesn't seem to work?  For now, I will load data in the LightCurveViewer.js file
import data from './data/27882110006813.json';

let wrapper

describe('Component > LightCurveViewer', function () {
  before(function () {
    const inputData = data
    console.log("checking input data", inputData)

    // Use mount() instead of shallow() since d3 logic exists outside of render()
    wrapper = render(<LightCurveViewer.wrappedComponent inputData={inputData} />)
  })

  it('should render without crashing', function () {
    expect(wrapper).to.be.ok
  })
})
