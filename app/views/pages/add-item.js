import React from 'react/addons';
// import AddItem from '../components/add-item/index.js';
import _ from 'lodash';
import {State,Link} from 'react-router';
import {Modal, Nav, NavItem} from 'react-bootstrap';
// Components
import {MentionsInput, Mention} from '@sprintly/react-mentions';
import Title from '../components/add-item/title';
import TagsInput from '../components/tags-input';
import StoryTitle from '../components/add-item/story-title';
import MembersDropdown from '../components/add-item/members-dropdown';
import IssueTemplates from '../components/add-item/issue-templates';
import Select from 'react-select';

import ItemActions from '../../actions/item-actions';
import ProductStore from '../../stores/product-store';
import helpers from '../components/helpers';

const ITEM_TYPES = ['story', 'task', 'defect', 'test'];
const STORY_ATTRS = ['who', 'what', 'why'];

let stripeHeight = function() {
  let bodyHeight = document.body.getBoundingClientRect().height;
  let headerHeight = document.getElementsByClassName('product__header-menu')[0].getBoundingClientRect().height;

  return bodyHeight - headerHeight;
}

var AddItemPage = React.createClass({
  mixins: [React.addons.LinkedStateMixin, State],

  propTypes: {
    tags: React.PropTypes.array,
    members: React.PropTypes.array,
    product: React.PropTypes.object
  },

  getInitialState() {
    let product = ProductStore.getProduct(this.getParams().id);

    return {
      product: product,
      stripeHeight: stripeHeight(),
      type: 'story',
      title: '',
      who: '',
      what: '',
      why: '',
      description: '',
      tags: [],
      assigned_to: null,
      assigneeName: '',
      sendToBacklog: true,
      validation: {
        title: true,
        who: true,
        what: true,
        why: true
      }
    }
  },

  getDefaultProps() {
    return {
      members: []
    }
  },

  setDescription(ev, value) {
    this.setState({ description: value });
  },

  setAssignedTo(value, member) {
    let memberName = _.chain(member).pluck('label').first().value()

    this.setState({
      assigned_to: value,
      assigneeName: memberName
    })
  },

  updateTags(tags) {
    this.setState({ tags });
  },

  changeType(type) {
    var descriptionTemplate = (type === 'defect') ? IssueTemplates.defect : '';
    this.setDescription(null, descriptionTemplate);

    this.setState({ type: type }, () => {
      // ensure focus follows tabbing through types
      this.setFocus(type);
    });
  },

  setFocus(itemType) {
    let ref = itemType === 'story' ? this.refs.title.refs.whoInput :
        this.refs.title.refs.titleInput;
      React.findDOMNode(ref).focus();
  },

  dismiss(ev) {
    ev.preventDefault();
    this.props.onHide();
  },

  onKeyDown(ev) {
    let charCode = (typeof ev.which === "number") ? ev.which : ev.keyCode;
    if ((ev.metaKey || ev.ctrlKey) && (charCode === 13 || charCode === 10)) {
      this.createItem(ev, false);
    }
    return;
  },

  createItem(ev) {
    ev.preventDefault();

    let item = _.pick(this.state, ['type', 'description', 'tags', 'assigned_to']);

    if (this.state.type === 'story') {
      _.assign(item, _.pick(this.state, STORY_ATTRS));
    } else {
      item.title = this.state.title;
    }

    if (this.state.sendToBacklog) {
      item.status = 'backlog';
    }

    ItemActions.addItem(this.props.product.id, item).then( () => {
      let resetState = _.extend({}, this.getInitialState(), { type: this.state.type });
      this.setState(resetState);
      this.setFocus(this.state.type);

    }, (err) => {
      this.updateValidation(err);
    });
  },

  updateValidation(err) {
    let validationState = this.state.validation;
    let errors = err.validationError.split(':')[1].replace(/\s+/g, '').split(',');

    _.each(errors, (attr) => {
      validationState[attr] = false;
    });

    this.setState({validation: validationState});
  },

  notAssignable() {
    return !this.props.members.length;
  },

  assignPlaceholder() {
    return this.notAssignable() ? 'Nobody to assign to': 'Unassigned';
  },

  assigneeName() {
    return this.state.assigneeName ? this.state.assigneeName : null;
  },

  drawerStripe() {
    let stripeClass = `stripe ${this.state.type}`;
    let closeClass = `drawer__close ${this.state.type}`;
    let stripeStyles = {height: `${this.state.stripeHeight}px`};

    return (
      <div style={stripeStyles} className={stripeClass}>
        <Link to="product" params={{ id: this.getParams().id }} className={closeClass}>
          <span aria-hidden="true" className="glyphicon glyphicon-remove"/>
        </Link>
      </div>
    )
  },

  typeSelector() {
    let options = _.map(ITEM_TYPES, (option) => {
      return {label: helpers.toTitleCase(option), value: option}
    })

    return (
      <div className="col-xs-12 form-group add-item__type-dropdown">
        <div className="col-xs-2 no-gutter">
          <span>Create a new</span>
        </div>
        <div className="col-xs-10 no-gutter">
          <Select name="form-field-name"
                  className="type-dropdown"
                  value={this.state.type}
                  options={options}
                  onChange={this.changeType}
                  clearable={false} />
        </div>
      </div>
    )
  },

  itemDescription() {
    let mentions = helpers.formatMentionMembers(this.props.members);

    return (
      <div className="form-group">
        <MentionsInput
          value={this.state.description}
          onChange={this.setDescription}
          placeholder="Add a description...">
            <Mention data={mentions} />
        </MentionsInput>
      </div>
    )
  },

  itemTags() {
    let tags = _.pluck(this.state.product.tags, 'tag');

    return (
      <div className="form-group">
        <TagsInput tags={tags} onChange={this.updateTags} value={this.state.tags}/>
      </div>
    )
  },

  membersSelect() {
    let members = helpers.formatSelectMembers(this.props.members);

    return (
      <div className="form-group add-item__member-dropdown">
        <Select placeholder={this.assignPlaceholder()}
                name="form-field-name"
                className="assign-dropdown"
                disabled={this.notAssignable()}
                value={this.assigneeName()}
                options={members}
                onChange={this.setAssignedTo}
                clearable={true} />
      </div>
    )
  },

  itemActions() {
    return ([
        <div className="col-xs-12 add-item__actions no-gutter">
          <input type="submit" className="btn btn-primary btn-lg create-item" value="Create Item"/>
          <button className="btn btn-default btn-lg cancel-item" onClick={this.dismiss}>Cancel</button>
        </div>,
        <div className="checkbox pull-right">
          <label>
            <input className="backlog-checkbox" type="checkbox" name="backlog" checkedLink={this.linkState('sendToBacklog')}/>
            Automatically send to backlog.
          </label>
        </div>
      ]
    )
  },

  itemTitle() {
    if (this.state.type === 'story') {
      return (
        <StoryTitle
          ref="title"
          who={this.linkState('who')}
          what={this.linkState('what')}
          why={this.linkState('why')}
          validation={this.linkState('validation')}
        />
      );
    } else {
      return (
        <Title
          ref="title"
          title={this.linkState('title')}
          validation={this.linkState('validation')}
        />
      )
    }
  },

  componentDidMount() {
    ProductStore.addChangeListener(this._onChange);
  },

  componentWillUnmount() {
    ProductStore.removeChangeListener(this._onChange);
  },

  render() {
    return (
      <div className="container-fluid add-item no-gutter drawer">
        {this.drawerStripe()}
        <div className="drawer__content">
          <div className="col-xs-12">
            {this.typeSelector()}
            <form className="col-xs-12 add-item__form" onSubmit={this.createItem} onKeyDown={this.onKeyDown}>
              {this.itemTitle()}
              {this.itemDescription()}
              {this.itemTags()}
              {this.membersSelect()}
              {this.itemActions()}
            </form>
          </div>
        </div>
      </div>
    )
  },

  _onChange() {
    let product = ProductStore.getProduct(this.getParams().id);

    if (product) {
      this.setState({product});
    }
  }
});

export default AddItemPage;
