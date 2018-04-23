import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';
import Link from 'next/link'

export default (props) => {
    return (
        <Menu style={{ marginTop: '10px' }}>
            <Link href='/'>
                <a className="item">Exchange Overview</a>
            </Link>
            <Menu.Menu position="right">
                <Link href='/exchange'>
                    <a className="item">Fixed Token Trading</a>
                </Link>
                <Link href='/managetoken'>
                    <a className="item">Manage Tokens</a>
                </Link>
            </Menu.Menu>
        </Menu>
    );
};