/* eslint-env mocha, node */
var _ = require('lodash')
var assert = require('chai').assert
var React = require('react/addons')
var TestUtils = React.addons.TestUtils
var FilterActions = require('../../../actions/filter-actions')
var sinon = require('sinon')
var FiltersSidebar = require('./filters')
var user = {
  user: {
    get: function() {},
    id: 123
  }
}
var filter = {
  field: 'type',
  criteria: ['story', 'task', 'test', 'defect']
}

describe('Sidebars/Filters', function() {
  beforeEach(function() {
    this.sinon = sinon.sandbox.create()
    this.props = _.assign({
      velocity: {
        average: 5
      },
      members: ['memberA'],
      tags: ['tagsA'],
      allFilters: [{
        field: 'assigned_to',
        criteria: ['person']
      },{
        field: 'created_by',
        criteria: ['person']
      }
      ],
      activeFilters: [filter]
    }, user)

    this.stubs = {
      filtersUpdate: this.sinon.stub(FilterActions, 'update'),
      filtersClear: this.sinon.stub(FilterActions, 'clear')
    }
  })

  afterEach(function() {
    this.sinon.restore()
  })

  describe('componentDidMount', function() {
    describe('with side props', function() {
      it('is not hidden', function() {
        var props = _.assign(this.props, {side: 'right'})
        var component = TestUtils.renderIntoDocument(<FiltersSidebar {...props} />)

        var sidebar = component.refs['filters-sidebar'].getDOMNode()

        assert.isFalse(sidebar.classList.contains('hidden'))
      })
    })

    describe('without side props', function() {
      it('is hidden', function() {
        var props = _.assign(this.props, {side: undefined})
        var component = TestUtils.renderIntoDocument(<FiltersSidebar {...props} />)

        var sidebar = component.refs['filters-sidebar'].getDOMNode()

        assert.isTrue(sidebar.classList.contains('hidden'))
      })
    })
  })

  describe('#issueTypesControl', function() {
    describe('active', function() {
      beforeEach(function() {
        var props = _.assign(this.props, {side: 'right'})
        this.component = TestUtils.renderIntoDocument(<FiltersSidebar {...props} />)
      })

      it('all button is active when all issue types are in active filters', function() {
        var allButton = this.component.refs['all-types'].getDOMNode()

        assert.isTrue(allButton.classList.contains('active'))
      })

      _.each(['story', 'test', 'task', 'defect'], function(type) {
        it('issue control link: '+ type + ' is active', function() {
          var refName = 'issue-link-'+type
          var link = this.component.refs[refName].getDOMNode()

          assert.isTrue(link.classList.contains('active'))
        })
      }, this)
    })

    describe('inactive', function() {
      beforeEach(function() {
        var props = _.assign(this.props, {side: 'right'})
        this.component = TestUtils.renderIntoDocument(<FiltersSidebar {...props} />)

        var issueControl = TestUtils.scryRenderedDOMComponentsWithClass(this.component, 'issue-control')[0].getDOMNode()

        TestUtils.Simulate.click(issueControl)
        this.component.forceUpdate()
      })

      it('all button becomes inactive when issue type control is toggled', function() {
        var allButton = this.component.refs['all-types'].getDOMNode()

        assert.isFalse(allButton.classList.contains('active'))
      })

      it('issue type control link inactive when toggled', function() {
        var storyTypeLink = this.component.refs['issue-link-story'].getDOMNode()

        assert.isFalse(storyTypeLink.classList.contains('active'))
      })
    })
  })

  describe('#mineButton', function() {
    beforeEach(function() {
      var props = _.assign(this.props, {side: 'right'})
      this.component = TestUtils.renderIntoDocument(<FiltersSidebar {...props} />)
    })

    context('mine state is active', function() {
      beforeEach(function() {
        this.component.setProps({
          activeFilters: [
            filter,
            {
              field: 'assigned_to',
              criteria: 123
            }
          ]
        })

        this.mineButton = this.component.refs['sidebar-filter-mine'].getDOMNode()
      })

      it('button is active', function() {
        assert.isTrue(this.mineButton.classList.contains('active'))
      })

      context('unset \'mine\' filter', function() {
        beforeEach(function() {
          TestUtils.Simulate.click(this.mineButton)
        })

        it('clears all filters', function() {
          assert.isTrue(this.stubs.filtersClear.called)
        })
      })
    })

    context('mine state is inactive', function() {
      it('button is inactive', function() {
        var mineButton = this.component.refs['sidebar-filter-mine'].getDOMNode()
        assert.isFalse(mineButton.classList.contains('active'))
      })

      context('set \'mine\' filter', function() {
        it('sets the assigned_to filter to the user id', function() {
          var mineButton = this.component.refs['sidebar-filter-mine'].getDOMNode()
          TestUtils.Simulate.click(mineButton)

          assert.isTrue(this.stubs.filtersUpdate.calledWith('assigned_to', 123, {}))
        })
      })
    })
  })

  describe('#clearButton', function() {
    beforeEach(function() {
      this.props = _.assign(this.props, {side: 'right'})
      this.props.activeFilters.criteria = ['task', 'test', 'defect']
      this.component = TestUtils.renderIntoDocument(<FiltersSidebar {...this.props} />)
      this.clearButton = this.component.refs['sidebar-clear-button'].getDOMNode()
      // Remove story from criteria so that it is 'inactive'
    })

    it('calls clear on filter actions', function() {
      TestUtils.Simulate.click(this.clearButton)

      assert.isTrue(this.stubs.filtersClear.calledWith(['memberA'], ['tagsA']))
    })

    it('resets the issue type control links to active', function() {
      TestUtils.Simulate.click(this.clearButton)

      assert.isTrue(this.stubs.filtersUpdate.calledWith('type', ['story', 'task', 'test', 'defect']))
    })
  })
})
