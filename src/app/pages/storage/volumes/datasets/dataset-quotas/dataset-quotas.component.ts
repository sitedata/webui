import { Component } from '@angular/core';
import { FormGroup, Validators, ValidationErrors, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { DialogService, StorageService, WebSocketService, UserService } from '../../../../../services/';
import  helptext  from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-dataset-quotas',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class DatasetQuotasComponent {
  public queryCall: string = 'pool.dataset.get_quota';
  public route_success: string[] = [ 'storage', 'pools' ];
  public entityForm: any;
  public dataFields = ['user_data_quota', 'group_data_quota'];
  public pk: string;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext.users.heading,
      label: true,
      config: [
        {
          type: 'select',
          name: 'user',
          placeholder: helptext.users.placeholder,
          tooltip: helptext.users.tooltip,
          multiple: true,
          options: [],
        },
        {
          type: 'input',
          name: 'user_data_quota',
          placeholder: helptext.users.data_placeholder,
          tooltip: helptext.users.data_tooltip,
          value: 0,
          blurStatus: true,
          blurEvent: this.blurEvent,
          parent: this,
        },
        {
          type: 'input',
          name: 'user_obj_quota',
          placeholder: helptext.users.obj_placeholder,
          tooltip: helptext.users.obj_tooltip,
          value: 0
        }
      ]},
      {
        name: helptext.groups.heading,
        label: true,
        config: [

        {
          type: 'select',
          name: 'group',
          placeholder: helptext.groups.placeholder,
          tooltip: helptext.groups.tooltip,
          multiple: true,
          options: [],
        },
        {
          type: 'input',
          name: 'group_data_quota',
          placeholder: helptext.groups.data_placeholder,
          tooltip: helptext.groups.data_tooltip,
          value: 0,
          blurStatus: true,
          blurEvent: this.blurEvent2,
          parent: this,
        },
        {
          type: 'input',
          name: 'group_obj_quota',
          placeholder: helptext.groups.obj_placeholder,
          tooltip: helptext.groups.obj_tooltip,
          value: 0
        }

      ],
      width: '50%'
    },
    {
      name: 'divider',
      divider: true
    }
  ];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected aroute: ActivatedRoute) { }

  // resourceTransformIncomingRestData(data) {
  //   console.log(data);
  //   return data;
  // }

  preInit(entityForm: EntityFormComponent) {

    const paramMap: any = (<any>this.aroute.params).getValue();
    console.log(paramMap)
    this.pk = paramMap.pk;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    const users = _.find(this.fieldConfig, {name: "user"});
      const groups = _.find(this.fieldConfig, {name: "group"});

    this.ws.call('user.query', [[["builtin", "=",false]]]).subscribe(res => {
      res.map(user => {
        users.options.push({label: user.username, value: user.uid})
      })
    });

    this.ws.call('group.query', [[["builtin", "=",false]]]).subscribe(res => {
      res.map(group => {
        groups.options.push({label: group.group, value: group.gid})
      })
    });

    this.dataFields.forEach(field => 
      entityEdit.formGroup.controls[field].valueChanges.subscribe((value) => {
        const formField = _.find(this.fieldConfig, { name: field });
        const filteredValue = value ? this.storageService.convertHumanStringToNum(value, false, 'kmgtp') : undefined;
        formField['hasErrors'] = false;
        formField['errors'] = '';
        if (filteredValue !== undefined && isNaN(filteredValue)) {
          formField['hasErrors'] = true;
          formField['errors'] = 'Oops';
        };
      })
    );
    this.ws.call('pool.dataset.get_quota', [this.pk, 'GROUP']).subscribe((pk_dataset)=>{
      console.log(pk_dataset)
    })
  }

  blurEvent(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'user_data_quota');
    }
  }

  blurEvent2(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'group_data_quota');
    }
  }

  transformValue(parent, fieldname: string) {
    parent.entityForm.formGroup.controls[fieldname].setValue(parent.storageService.humanReadable || 0);
    // Clear humanReadable value to keep from accidentally setting it elsewhere
    parent.storageService.humanReadable = '';
  }

  customSubmit(data) {
    let quotas = [];
    data.ds = this.pk;
    data.user.forEach((user) => {
      quotas.push({
        quota_type: 'USER',
        id: user,
        quota_value: this.storageService.convertHumanStringToNum(data.user_data_quota)
      })
    })
    data.quotas = quotas;
    console.log(data);
  }

}