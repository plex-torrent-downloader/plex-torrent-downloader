import {useState} from "react";
import {Form, useTransition} from "@remix-run/react";
import Loading from "~/components/Loading";
import {RecentSearches} from "@prisma/client";
import moment from "moment/moment";

interface Props {
    itemName: string;
    query?: string;
    action?: string;
    onSearch?: (query: string) => void;
    children: any;
}

export default function SearchPanel(props: Props) {
    const {state} = useTransition();

    return <div className="container-fluid">
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">Search</h1>
        </div>
        <div className="card shadow mb-4">
            <div className="card-header py-3">
                <h6 className="m-0 font-weight-bold text-primary">Search Results from {props.itemName}</h6>
            </div>
            <div className="card-body">
                <div className="row">
                    {state === "submitting" && <Loading />}
                    {state !== "submitting" && props.children}
                </div>
            </div>
        </div>
    </div>


}
