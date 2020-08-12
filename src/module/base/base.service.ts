/*
 * @file: BaseService
 * @copyright: NanJing Anshare Tech .Com
 * @author: BoBo
 * @Date: 2020年08月10 10:44:35
 */
import { Injectable } from '@nestjs/common';

import {
  BaseEntity,
  Repository,
  FindManyOptions,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Like,
  Equal,
  Not,
  IsNull,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ResultGenerator } from './../../core/resultBean';

interface searchType {
  field: string;
  operator: string;
  value: any;
}

interface SearchCondition {
  orderCondition: string;
  searchCondition: searchType[];
  pageIndex: number;
  pageSize: number;
}

@Injectable()
export abstract class BaseService<T> {
  protected repository: Repository<T>;
  constructor(@InjectRepository(BaseEntity) repository: Repository<T>) {
    this.repository = repository;
  }

  // 新增接口
  async add(entity: T) {
    await this.repository.insert(entity);
    return ResultGenerator.success(entity, '新增成功');
  }
  // 更新接口
  async update(id: string, entity: T) {
    await this.repository.update(id, entity);
    return ResultGenerator.success(id, '更新成功');
  }

  // 删除接口
  async delete(id: string) {
    await this.repository.delete(id);
    return ResultGenerator.success(id, '删除成功');
  }

  // 批量删除接口
  async deleteByIds(ids: string[]) {
    await this.repository.delete(ids);
    return ResultGenerator.success(ids, '删除成功');
  }

  // 查询ById接口
  async findById(id: string) {
    const result = await this.repository.findOne(id);
    return ResultGenerator.success(result);
  }

  // list方法带高级查询
  async find(args: SearchCondition) {
    // https://typeorm.io/#/find-options     ->     FindManyOptions
    const params: FindManyOptions = {
      // 缓存
      cache:true
    };

    const { pageIndex, pageSize, searchCondition, orderCondition } = args;
    // 拼接order条件
    if (orderCondition && orderCondition.includes(' ')) {
      const [field, order] = orderCondition.split(' ');
      params.order = {};
      params.order[field] = order.toUpperCase() === 'ASC' ? 1 : -1;
    }
    // 拼接分页条件
    // 若pageIndex,pageSize = 0,0
    // 则默认查询全部
    if (pageIndex + pageSize > 1) {
      params.skip = (pageIndex - 1) * pageSize;
      params.take = pageSize;
    }
    if(Array.isArray(searchCondition) && searchCondition.length>0){
      // 拼接高级查询条件
      this.getSearchCondition(searchCondition, params);
    }
    
    const [list, total] = await this.repository.findAndCount(params);

    return ResultGenerator.success({
      list,
      total,
    });
  }

  getSearchCondition(searchCondition: searchType[], params: FindManyOptions) {
    // 一键搜 查询方式为orlike拼接
    let orLike = searchCondition.find(item => item.operator === 'orlike');
    if (orLike) {
      params.where = [];
      let fields = orLike.field.split(',');
      fields.forEach(field => {
        (params.where as any[]).push({
          [field]: Like(`%${orLike.value}%`),
        });
      });
    } else {
      // ...
      params.where = {};
      searchCondition.forEach(obj => {
        const { value, operator, field } = obj;
        switch (operator) {
          case 'eq': // =
            params.where[field] = Equal(value);
            break;
          case 'neq':
            params.where[field] = Not(value);
            break;
          case 'notNull':
            params.where[field] = Not(IsNull());
            break;
          case 'isNull':
            params.where[field] = IsNull();
            break;
          case 'gt':
            params.where[field] = MoreThan(value);
            break;
          case 'lt':
            params.where[field] = LessThan(value);
            break;
          case 'egt':
            params.where[field] = MoreThanOrEqual(value);
            break;
          case 'elt':
            params.where[field] = LessThanOrEqual(value);
            break;
          case 'like':
            params.where[field] = Like(`%${value}%`);
            break;
          default:
            break;
        }
      });
    }
  }
}
