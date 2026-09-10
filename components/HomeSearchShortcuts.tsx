"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/client-api";
import { withLocale } from "@/lib/locales";
import type { ApiPage, Locale } from "@/types/api";
import { homeCopy } from "@/lib/home-copy";

type SearchMode = "make" | "find" | "car";
type LocationOption = { id?: number; name?: string };
type ApiListResponse<T> = { data?: T[] | { data?: T[] } };

function listData<T>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response.data)) return response.data;
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

function DateTimeField({ name, placeholder, nativeType }: { name: string; placeholder: string; nativeType: "date" | "datetime-local" }) {
  const [type, setType] = useState<"text" | "date" | "datetime-local">("text");

  const activateAndOpen = (el: HTMLInputElement) => {
    if (el.type !== nativeType) {
      el.type = nativeType;
      setType(nativeType);
    }
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
      }
    } catch {}
  };

  return (
    <input
      name={name}
      data-native-type={nativeType}
      onBlur={(event) => { if (!event.target.value) setType("text"); }}
      onChange={(event) => { if (event.target.value) setType(nativeType); }}
      onFocus={(event) => {
        if (event.target.type !== nativeType) {
          event.target.type = nativeType;
          setType(nativeType);
        }
      }}
      onClick={(event) => {
        activateAndOpen(event.currentTarget);
      }}
      placeholder={placeholder}
      required
      type={type}
    />
  );
}

export function HomeSearchShortcuts({ locale = "en", destinations, modeOnly }: { locale?: Locale; destinations: ApiPage[]; modeOnly?: SearchMode }) {
  const router = useRouter();
  const copy = homeCopy(locale);
  const [mode, setMode] = useState<SearchMode>(modeOnly ?? "make");
  const [makeType, setMakeType] = useState("existTime");
  const [carType, setCarType] = useState("oneWay");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [dropLocations, setDropLocations] = useState<LocationOption[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationsFailed, setLocationsFailed] = useState(false);

  useEffect(() => {
    if (mode !== "car") return;
    apiGet<ApiListResponse<LocationOption>>("locations?page_limit=200&order_by=id,asc", locale, false)
      .then((response) => {
        setLocations(listData(response));
        setLocationsFailed(false);
      })
      .catch(() => setLocationsFailed(true));
  }, [locale, mode]);

  async function loadDropLocations(pickupId: string) {
    if (!pickupId) return;
    setLoadingLocations(true);
    setLocationsFailed(false);
    try {
      const response = await apiPost<{ data?: LocationOption[] }>("car/rental/available/destinations", { pickup_location_id: Number(pickupId) }, locale);
      setDropLocations(Array.isArray(response.data) ? response.data : []);
    } catch {
      setLocationsFailed(true);
    } finally {
      setLoadingLocations(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (mode === "find") {
      router.push(withLocale(`/trips?days=${form.get("duration")}&distination=${encodeURIComponent(String(form.get("place") || ""))}`, locale));
      return;
    }
    if (mode === "car") {
      const params = new URLSearchParams({ type: carType, picupDate: String(form.get("pickupDate") || ""), location: String(form.get("location") || ""), dropLoaction: String(form.get("dropLocation") || "") });
      if (carType === "roundTrip") params.set("returnDate", String(form.get("returnDate") || ""));
      router.push(`${withLocale("/rent-car", locale)}?${params.toString()}`);
      return;
    }
    const params = new URLSearchParams({ type: makeType });
    if (makeType === "existTime") {
      params.set("from", String(form.get("fromDate") || ""));
      params.set("to", String(form.get("toDate") || ""));
    } else if (makeType === "approximateTime") {
      params.set("month", String(form.get("month") || ""));
    } else {
      params.set("days", String(form.get("days") || ""));
    }
    router.push(`${withLocale("/make-your-trip", locale)}?${params.toString()}`);
  }

  return (
    <form className="home-search-panel" onSubmit={submit}>
      {!modeOnly ? (
        <div className="home-search-tabs" role="tablist" aria-label={copy.makeYourTrip}>
          {([["make", copy.makeYourTrip], ["find", copy.findTripShort], ["car", copy.rentCarShort]] as const).map(([value, label]) => (
            <button className={mode === value ? "is-active" : ""} key={value} onClick={() => setMode(value)} role="tab" aria-selected={mode === value} type="button">{label}</button>
          ))}
        </div>
      ) : null}
      {mode === "make" ? (
        <div className="home-search-fields home-search-make-fields">
          <fieldset aria-label={copy.whenTravelling} role="radiogroup"><span className="home-search-question">{copy.whenTravelling}</span><label><input checked={makeType === "existTime"} name="makeType" onChange={() => setMakeType("existTime")} type="radio" /> {copy.exactTime}</label><label><input checked={makeType === "approximateTime"} name="makeType" onChange={() => setMakeType("approximateTime")} type="radio" /> {copy.approximateTime}</label><label><input checked={makeType === "notSureYet"} name="makeType" onChange={() => setMakeType("notSureYet")} type="radio" /> {copy.notSureYet}</label></fieldset>
          {makeType === "existTime" ? <><label><span>{copy.from}</span><DateTimeField name="fromDate" nativeType="date" placeholder={copy.selectStartDate} /></label><label><span>{copy.to}</span><DateTimeField name="toDate" nativeType="date" placeholder={copy.selectEndDate} /></label></> : null}
          {makeType === "approximateTime" ? (
            <label>
              <span>{copy.selectMonth}</span>
              <input
                name="month"
                required
                type="month"
                aria-label={copy.selectExpectedMonth}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
              />
            </label>
          ) : null}
          {makeType === "notSureYet" ? <label><span>{copy.manyDays}</span><input min="1" name="days" required type="number" placeholder={copy.manyDays} /></label> : null}
          <button className="btn-primary" type="submit">{copy.makeTripShort}</button>
        </div>
      ) : null}
      {mode === "find" ? <div className="home-search-fields"><label><span>{copy.where}?</span><select defaultValue="" name="place" required><option disabled value="">{copy.choosePlace}</option>{destinations.map((destination) => <option key={String(destination.id || destination.slug)} value={destination.slug || destination.id}>{destination.title || destination.name}</option>)}</select></label><label><span>{copy.howLong}?</span><select defaultValue="" name="duration" required><option disabled value="">{copy.chooseDuration}</option>{Array.from({ length: 45 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><button className="btn-primary" type="submit">{copy.search}</button></div> : null}
      {mode === "car" ? <div className="home-search-fields home-search-car-fields"><fieldset aria-label={copy.tripType} role="radiogroup"><span className="home-search-question">{copy.tripType}</span><label><input checked={carType === "oneWay"} name="carType" onChange={() => setCarType("oneWay")} type="radio" value="oneWay" /> {copy.oneWay}</label><label><input checked={carType === "roundTrip"} name="carType" onChange={() => setCarType("roundTrip")} type="radio" value="roundTrip" /> {copy.roundTrip}</label></fieldset><label><span>{copy.carHolder}</span><select defaultValue="" name="location" onChange={(event) => loadDropLocations(event.target.value)} required><option disabled value="">{copy.choosePickup}</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><label><span>{copy.dropoff}</span><select defaultValue="" name="dropLocation" required><option disabled value="">{loadingLocations ? "Loading..." : copy.chooseDropoff}</option>{dropLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><label><span>{copy.pickupDate}</span><DateTimeField name="pickupDate" nativeType="datetime-local" placeholder={copy.choosePickupDate} /></label>{carType === "roundTrip" ? <label><span>{copy.returnDate}</span><DateTimeField name="returnDate" nativeType="datetime-local" placeholder={copy.chooseReturnDate} /></label> : null}<button className="btn-primary" type="submit">{copy.sendRequest}</button>{locationsFailed ? <p role="alert">Locations are temporarily unavailable. Please try again.</p> : null}</div> : null}
    </form>
  );
}
